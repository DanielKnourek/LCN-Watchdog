import { z } from "zod";
import { env } from "~/env";
import { db } from "~/server/db";
import { trackedStocks, mediaTracker } from "~/server/db/schema";

const MediaWebzioSchema = z.object({
  totalResults: z.number().min(0),
  requestsLeft: z.number(),
  posts: z.array(z.object({
    uuid: z.string(),
    // uuid: z.string().uuid(), // cannot parse, not a stnadard uuid
    title: z.string(),
    published: z.string(),
    url: z.string(),
  })),
});

type MediaWebzio = z.infer<typeof MediaWebzioSchema>;

interface DowloadMediaWebzioParams {
  query_name: string;
  sentiment: 'negative' | 'positive' | 'neutral';
  min_time?: Date;
  max_time?: Date;
}

/**
 * This function downloads media data from Webz.io API based on the provided parameters.
 */
const dowloadMediaWebzio = async ({ query_name, sentiment, min_time }: DowloadMediaWebzioParams) => {
  // default to 24 hours ago
  min_time = min_time ?? new Date(Date.now() - 1000 * 60 * 60 * 24);

  const query_filters: string[] = [
    `${query_name}`,
    'topic:"financial and economic news"',
    `sentiment:${sentiment}`,
    // 'domain_rank:<1000',
    `published:>${min_time.getTime()}`,
  ];

  const request_uri = `https://api.webz.io/newsApiLite?token=${env.WEBZIO_API_KEY}&q=${query_filters.join(' ')}`;

  const data = await fetch(request_uri)
    .then((res) => {
      if (!res.ok) {
        //TODO log error
        console.error("Error fetching data:", res.statusText); //TODO remove log
        if (res.status === 500) {
          throw new Error("Failed to execute query: internal error");
        }
        throw new Error("Network response was not ok");
      }
      return res.json();
    })
    .then((data) => {
      return MediaWebzioSchema.parseAsync(data);
    })
    .catch((error) => {
      console.error("Error parsing data:", error); //TODO remove log
      throw error;
    });

  // console.log("data", data); //TODO remove log
  // console.log(`querry: |${query_name}| sentiment: |${sentiment}|`); //TODO remove log
  // TODO log how many requests remaining
  return data;
};

interface evaluateScoreWebzioParams {
  positive: MediaWebzio;
  negative: MediaWebzio;
  neutral: MediaWebzio;
}
/**
 * This function evaluates the score of media data from Webz.io API based on the provided parameters.
 * It calculates the ratio of positive, negative, and neutral sentiments. and normalizes the score to range < -10,10 > integers
 */
const evaluateScoreWebzio = ({ positive, negative, neutral }: evaluateScoreWebzioParams) => {
  const NEUTRAL_WEIGHT = 0.1; // TODO: add to env
  const AMPLIFY_FINAL = 1.5; // TODO: add to env
  const neutral_score = neutral.totalResults * NEUTRAL_WEIGHT;
  const positive_score = positive.totalResults;
  const negative_score = negative.totalResults;

  // if no data, return score 0
  if (positive_score === 0 && negative_score === 0 && neutral_score === 0) {
    return 0;
  }
  const total_score = positive_score + negative_score + neutral_score;
  const positive_ratio = positive_score / total_score;
  const negative_ratio = negative_score / total_score;

  let score = positive_ratio - negative_ratio;
  score = score * AMPLIFY_FINAL; // amplify the score
  let normalized_score = Math.round(score * 10); // normalize to range < -10,10 >


  if (normalized_score > 10) {
    normalized_score = 10;
  } else if (normalized_score < -10) {
    normalized_score = -10;
  }

  return normalized_score;
}

/**
 * It queries the database for the last update timestamp. 
 * If no update is found, it defaults to 24 hours ago.
 */
const getLastUpdate = async (): Promise<Date> => {
  return await db.select({ timestamp: mediaTracker.timestamp })
    .from(mediaTracker)
    .orderBy(mediaTracker.timestamp).limit(1)
    .then((lastUpdate) => {
      if (lastUpdate.length === 0 || lastUpdate[0] === undefined) {
        return new Date(Date.now() - 1000 * 60 * 60 * 24); // default to 24 hours ago
      }
      return lastUpdate[0].timestamp;
    })
    .catch((error) => {
      console.error("Error fetching last update:", error); //TODO remove log
      return new Date(Date.now() - 1000 * 60 * 60 * 24); // default to 24 hours ago
    });
}

const updateAll = async () => {
  await updateAllTrackedStocks({
    lastUpdate: await getLastUpdate(),
    trackedStocksList: await db.select().from(trackedStocks),
  })
}

interface updateAllTrackedStocksParams {
  lastUpdate: Date;
  trackedStocksList: { id: number; name: string }[];
}

const sentiments: DowloadMediaWebzioParams['sentiment'][] = ['positive', 'negative', 'neutral'];

const updateAllTrackedStocks = async ({ lastUpdate, trackedStocksList }: updateAllTrackedStocksParams) => {

  for (const stock of trackedStocksList) {
    const stockMediaData: Awaited<ReturnType<typeof dowloadMediaWebzio>>[] = [];

    for (const sentiment of sentiments) {
      const data = await dowloadMediaWebzio({
        query_name: stock.name,
        sentiment: sentiment,
        min_time: lastUpdate,
      });
      stockMediaData.push(data);
    }

    await db
      .insert(mediaTracker)
      .values({
        stock_id: stock.id,
        articles_positive_count: stockMediaData[0]?.totalResults ?? 0,
        articles_negative_count: stockMediaData[1]?.totalResults ?? 0,
        articles_neutral_count: stockMediaData[2]?.totalResults ?? 0,
      })
      .then(() => {
        // TODO: log success
      })
      .catch((error) => {
        // TODO: log error
        console.error("Error updating media data:", error); // TODO remove log
      });
  }
}


const run = async () => { //TODO: remove fn
  console.log("Running media downloader..."); //TODO remove log
  return {}
};

export { dowloadMediaWebzio, evaluateScoreWebzio, updateAllTrackedStocks, updateAll, getLastUpdate };
export default run;