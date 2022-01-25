const axios = require('axios');
const qs = require('qs');
const addOAuthInterceptor = require('axios-oauth-1.0a').default;

const key = process.env.CONSUMER_KEY;
const secret = process.env.CONSUMER_SECRET;
const token = process.env.ACCESS_TOKEN;
const tokenSecret = process.env.TOKEN_SECRET;

exports.handler = function (event, context) {

    async function init() {
        await sleep(4000);

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

        const extractLastWeek = (tweets) => {

            const selection = tweets.filter(tweet => tweet.text.includes('Přibylo'));
            let weekAgo = selection[7];
            const text = '@covidbot_cz ' + ('Minulý týden to ' + weekAgo.text.substring(3)).replace('je', 'bylo');

            return { text, tweet: selection[0] };

        }


        client.get('https://api.twitter.com/1.1/statuses/user_timeline.json', {
            params: {
                count: 199,
                exclude_replies: true

            }
        })
            .then(function (response) {
                console.log(response);
                info = extractLastWeek(response.data);

                client.post('https://api.twitter.com/1.1/statuses/update.json', null, {
                    params: {
                        status: info.text,
                        in_reply_to_status_id: info.tweet.id_str,
                        auto_populate_reply_metadata: true
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
            })
            .catch(function (error) {
                console.log(error);
            });

        return context.logStreamName

    }

    function sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    init();

}






