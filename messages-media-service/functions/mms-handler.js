exports.handler = function(context, event, callback) {
    const rp = require("request-promise");

    const base64Token = Buffer.from(
        `${context.ACCOUNT_SID}:${context.AUTH_TOKEN}`
    ).toString("base64");

    const HTTP_BASIC_AUTH = `https://${context.ACCOUNT_SID}:${
        context.AUTH_TOKEN
    }@api.twilio.com/2010-04-01/Accounts`;

    const inboundResourceUrlEndpoint = event.inboundResourceUrl.replace(
        "https://api.twilio.com/2010-04-01/Accounts",
        HTTP_BASIC_AUTH
    );

    let SESSION_SID;
    let CHANNEL_SID;
    let mediaType;
    let mediaURL;
    let MESSAGE_SID;

    if (event.inboundResourceSid.includes("MM")) {
        SESSION_SID = event.interactionSessionSid;
        MESSAGE_SID = event.outboundResourceSid;
        rp({
            method: "GET",
            uri: inboundResourceUrlEndpoint,
            json: true
        })
            .then(function(result) {
                // Check if the message has any media
                console.log("result is " + result);

                if (result.subresource_uris && result.subresource_uris.media) {
                    const subResourceMediaURL = `https://${context.ACCOUNT_SID}:${
                        context.AUTH_TOKEN
                    }@api.twilio.com${result.subresource_uris.media}`;

                    console.log(subResourceMediaURL);

                    return rp({
                        method: "GET",
                        uri: subResourceMediaURL,
                        json: true
                    });
                } else {
                    console.log("this happened");
                }
            })
            .then(function(result) {
                if (result.media_list) {
                    mediaType = result.media_list[0].content_type;
                    console.log('media content type:', mediaType);
                    mediaURL =
                        "https://api.twilio.com" +
                        result.media_list[0].uri.replace(".json", "");

                    console.log("this is the media Url " + mediaURL);

                    return rp({
                        method: "GET",
                        uri: `https://proxy.twilio.com/v1/Services/${
                            context.PROXY_SERVICE
                        }/Sessions/${SESSION_SID}`,
                        headers: {
                            Authorization: `Basic ${base64Token}`
                        },
                        json: true
                    });
                } else {
                    callback(null);
                }
            })
            .then(function(result) {
                CHANNEL_SID = result.unique_name.replace(/\.[^.]*$/, '');

                console.log("--- CHANNEL SID  ---- ", CHANNEL_SID)

                const options = {
                    method: "POST",
                    url: `https://chat.twilio.com/v2/Services/${
                        context.CHAT_SERVICE_SID
                    }/Channels/${CHANNEL_SID}/Messages/${MESSAGE_SID}`,
                    headers: {
                        Authorization: `Basic ${base64Token}`,
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    formData: { Attributes: `{"media": "${mediaURL}", "mediaType": "${mediaType}"}` }
                };
                return rp(options);
            })
            .then(result => {
                console.log(result);
                callback(null);
            })
            .catch(error => console.log(error));
    } else {
        console.log("not MMS");
        callback(null);
    }
};
