import { z } from "zod";
import { env } from "~/env";

// https://api.webz.io/newsApiLite?token=${env.WEBZIO_API_KEY}&q=Google topic:"financial and economic news" sentiment:negative

const SENTIMENT_FILTER = 'negative';
const QUERY_FILTER = 'Google';

interface dowloadMediaParams {
  query_name: string;
  sentiment: 'negative' | 'positive' | 'neutral';
  min_time?: Date;
  max_time?: Date;
}

const dowloadMedia = async({query_name, sentiment, min_time, max_time}:dowloadMediaParams) => {
  if (min_time === undefined) { // TODO: move out function
    min_time = new Date(Date.now()-1000 * 60 * 60 * 24); // default to 24 hours ago
  }
  const query_filters: string[] = [
    `${query_name}`,
    'topic:"financial and economic news"',
    `sentiment:${sentiment}`,
    'domain_rank:<1000',
    `published:>${min_time.getTime()}`,
  ];

  const request_uri = `https://api.webz.io/newsApiLite?token=${env.WEBZIO_API_KEY}&q=${query_filters.join(' ')}`;

  console.log(">>||query_filters<<||", request_uri); //TODO remove log
  const data = await fetch(request_uri)
  .then((res) => {
    if (!res.ok) {
      //TODO log error
      console.error("Error fetching data:", res.statusText);
      if (res.status === 500) {
        throw new Error("Failed to execute query: internal error");
      }
      throw new Error("Network response was not ok");
    }
    return res.json();
  })
  // console.log("data", data); //TODO remove log
  console.log(`querry: |${query_name}| sentiment: |${sentiment}|`); //TODO remove log
  // TODO log how many requests remaining
  return data;
};


const run = async() => {
  console.log("run media downloader"); //TODO remove log
  console.log(env.DATABASE_URL); //TODO remove log
  const data = await dowloadMedia({
    query_name: QUERY_FILTER,
    sentiment: 'positive',
    min_time: new Date(Date.now() - 1000 * 60 * 60 * 24)
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
  return { positive_data: data};
};

export default run;