import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { streamEndpoint } from '../env';
import { getAMSClient } from '../helpers/getAMSClient';
import { getSmoothStreamingURLForEvent } from '../helpers/getSmoothStreamingURLForEvent';

const errRes = (text: string, status = 400) => ({
  status,
  body: JSON.stringify({ error: `Oops! ${text}` }),
});

// type ARMErrorHack = {
//   error: {
//     code: string;
//     message: string;
//   };
// };

// const isError = (thing: unknown): thing is ARMErrorHack => {
//   if (thing === null || typeof thing != 'object') {
//     return false;
//   }

//   return thing.hasOwnProperty('error');
// };

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('HTTP trigger function processed a request.');

  const liveEventName = req.params.eventName.trim();

  if (liveEventName.length === 0) {
    context.res = errRes('Nothing to see here');
    return;
  }

  const useStreamEndpoint = req.params.streamEndpoint.trim() || streamEndpoint;

  try {
    const client = await getAMSClient();

    const streamURL = await getSmoothStreamingURLForEvent(client, useStreamEndpoint, liveEventName);

    if (streamURL.streaming === 'live') {
      context.res = {
        body: JSON.stringify({
          liveEventName,
          live: true,
          streamURL: streamURL.streamURL,
        }),
      };
    } else {
      context.res = {
        body: JSON.stringify({
          liveEventName,
          live: false,
          offlineReason: streamURL.error.message,
        }),
      };
      context.log(`Stream ${liveEventName} is offline because`, streamURL.error);
    }
  } catch (err) {
    context.log('Error fetching stream event information', err);
    context.res = errRes('Something went wrong, have you considered asking nicely?');
    return;
  }
};

export default httpTrigger;
