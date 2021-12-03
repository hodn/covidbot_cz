const https = require('https');
const axios = require('axios');
const addOAuthInterceptor = require('axios-oauth-1.0a').default;

const key = process.env.CONSUMER_KEY;
const secret = process.env.CONSUMER_SECRET;
const token = process.env.ACCESS_TOKEN;
const tokenSecret = process.env.TOKEN_SECRET;

exports.handler = function (event, context) {

  const updateTwitter = (confirmedCases, hospitalized) => {

    const client = axios.create();

    // Specify the OAuth options
    const options = {
      algorithm: 'HMAC-SHA1',
      key,
      secret,
      token,
      tokenSecret
    };

    // Add interceptor that signs requests
    addOAuthInterceptor(client, options);

    const status = `Přibylo ${confirmedCases} osob s nově prokázaným COVID-19. Hospitalizováno je ${hospitalized} pacientů.`;

    client.post('https://api.twitter.com/1.1/statuses/update.json', null, {
      params: {
        status: status
      }
    })
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });

  }

  https.get('https://onemocneni-aktualne.mzcr.cz/api/v2/covid-19/zakladni-prehled.json', (res) => {
    console.log('statusCode: ', res.statusCode);
    console.log('headers: ', res.headers);

    let response = '';

    res.on('data', (d) => {
      response += d;
    });

    res.on('end', (d) => {

      const confirmedCases = JSON.parse(response)['data'][0]['potvrzene_pripady_vcerejsi_den'];
      const hospitalized = JSON.parse(response)['data'][0]['aktualne_hospitalizovani'];
      const date = new Date(JSON.parse(response)['data'][0]['datum']);
      const updateDay = date.getDay();
      const today = new Date().getDay();

      if (updateDay === today) updateTwitter(confirmedCases, hospitalized);
    });

  }).on('error', (e) => {
    console.error(e);
  });

  return context.logStreamName
}




