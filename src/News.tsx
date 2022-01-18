import React from 'react';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';

interface NewsItem {
  title: string;
  description: string;
  link: string;
}
export const News = () => {
  const [news, setNews] = React.useState<String[]>([]);

  const fetchNews = async () => {
    const feed = await fetch('/status/cbc.json');
    const theNews = await feed.json();
    const headlines = theNews.items.map((newsItem: NewsItem) => {
      return newsItem.title;
    });
    setNews(headlines.slice(0, 3));
  };

  React.useEffect(() => {
    fetchNews();
  }, []);
    return (
      <>
        <h3>CBC News</h3>
        <Grid container direction="column" sx={{textAlign: 'left', paddingLeft: '2rem'}}>
          {news.map((newsItem, index) =>
            <>
            <Grid item xs key={index} sx={{paddingBottom: '1rem'}}>{newsItem}</Grid>
            </>
          )}
        </Grid>
      </>
    )
}

export default News;
