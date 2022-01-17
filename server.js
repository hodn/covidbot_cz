const axios = require('axios');
const qs = require('qs');
const addOAuthInterceptor = require('axios-oauth-1.0a').default;

const key = process.env.CONSUMER_KEY;
const secret = process.env.CONSUMER_SECRET;
const token = process.env.ACCESS_TOKEN;
const tokenSecret = process.env.TOKEN_SECRET;
const apiToken = process.env.API_TOKEN;

exports.handler = function (event, context) {

  const updateTwitter = (confirmedCases, hospitalized, reinfections) => {

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

    const status = `Přibylo ${confirmedCases} osob s nově prokázaným COVID-19 (včetně ${reinfections} reinfikovaných). Hospitalizováno je ${hospitalized} pacientů.`;

    client.post('https://api.twitter.com/1.1/statuses/update.json', null, {
      params: {
        status: status
      },
      paramsSerializer: params => {
        return qs.stringify(params)
      }
    })
      .then(function (response) {
        console.log(response);
      })
      .catch(function (error) {
        console.log(error);
      });

  }
  axios.get('https://onemocneni-aktualne.mzcr.cz/api/v3/zakladni-prehled?page=1&itemsPerPage=100&apiToken=' + apiToken)
  .then(function (response) {
    let confirmedCases = parseInt(response.data['hydra:member'][0]['potvrzene_pripady_vcerejsi_den']);
    const hospitalized = response.data['hydra:member'][0]['aktualne_hospitalizovani'];
    const date = new Date(response.data['hydra:member'][0]['datum']);
    const logDate = response.data['hydra:member'][0]['potvrzene_pripady_vcerejsi_den_datum'];

    axios.get(`https://onemocneni-aktualne.mzcr.cz/api/v3/nakazeni-reinfekce?page=1&itemsPerPage=1&datum%5Bafter%5D=${logDate}&apiToken=${apiToken}`)
      .then(function (response) {

        const reinfections = parseInt(response.data['hydra:member'][0]['nove_reinfekce']);
        confirmedCases += reinfections;

        const updateDay = date.getDay();
        const today = new Date().getDay();

        if (updateDay === today) updateTwitter(confirmedCases, hospitalized, reinfections);
      })
  }).catch(function (error) {
    console.log(error);
  });
  
  return context.logStreamName;
}




