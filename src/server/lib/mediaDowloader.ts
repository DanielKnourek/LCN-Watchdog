import { publicDecrypt } from "crypto";
import { uuid } from "drizzle-orm/gel-core";
import { url } from "inspector";
import { z } from "zod";
import { env } from "~/env";

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


interface dowloadMediaWebzioParams {
  query_name: string;
  sentiment: 'negative' | 'positive' | 'neutral';
  min_time?: Date;
  max_time?: Date;
}

/**
 * This function downloads media data from Webz.io API based on the provided parameters.
 */
const dowloadMediaWebzio = async({query_name, sentiment, min_time, max_time}:dowloadMediaWebzioParams) => {
  if (min_time === undefined) { // TODO: move out function
    min_time = new Date(Date.now()-1000 * 60 * 60 * 24); // default to 24 hours ago
  }
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
    throw new Error("Failed to parse data");
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
const evaluateScoreWebzio = ({positive, negative, neutral}:evaluateScoreWebzioParams) => {
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
  let normalized_score = Math.round(score *10); // normalize to range < -10,10 >
  
  
  if (normalized_score > 10) {
    normalized_score = 10;
  } else if (normalized_score < -10) {
    normalized_score = -10;
  }

  return normalized_score;
}

const run = async() => {
  const QUERY_FILTER = 'Google';
  console.log("run media downloader"); //TODO remove log
  const data = await dowloadMediaWebzio({
    query_name: QUERY_FILTER,
    sentiment: 'positive',
    min_time: new Date(Date.now() - 1000 * 60 * 60 * 24)
  });

  const result = evaluateScoreWebzio({
    positive: data,
    negative: {...data, totalResults: 140},
    neutral: {...data, totalResults: 140}
  });
  
  // const data2 = await dowloadMedia({
  //   query_name: QUERY_FILTER,
  //   sentiment: 'negative',
  //   min_time: new Date(Date.now() - 1000 * 60 * 60 * 24)
  // });

  // const data3 = await dowloadMedia({
  //   query_name: QUERY_FILTER,
  //   sentiment: 'neutral',
  //   min_time: new Date(Date.now() - 1000 * 60 * 60 * 24)
  // });
  // console.log(`positive_data_totalResults: |${data.totalResults}|\negative_data_totalResults: |${data2.totalResults}|\neutral_data_totalResults: |${data3.totalResults}|\n`); //TODO remove log
  // return { positive_data: data, negative_data: data2, neutral_data: data3 };
  return { positive_data: result};
};

export { dowloadMediaWebzio, evaluateScoreWebzio};
export default run;