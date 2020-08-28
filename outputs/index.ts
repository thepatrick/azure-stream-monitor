import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { accountName, resourceGroup } from '../env';
import { getAMSClient } from '../helpers/getAMSClient';
import { getOutputsForEvent } from '../helpers/getOutputsForEvent';

const errRes = (text: string, status = 400) => ({
  status,
  body: JSON.stringify({ error: `Oops! ${text}` }),
});

type ARMErrorHack = {
  error: {
    code: string;
    message: string;
  };
};

const isError = (thing: unknown): thing is ARMErrorHack => {
  if (thing === null || typeof thing != 'object') {
    return false;
  }

  return thing.hasOwnProperty('error');
};

// [28/8/2020 6:38:08 am] getOutputsForEvent() {
//   [28/8/2020 6:38:08 am]   error: {
//   [28/8/2020 6:38:08 am]     code: 'ResourceNotFound',
//   [28/8/2020 6:38:08 am]     message: "The Resource 'Microsoft.Media/mediaservices/ndvmediaservice1/liveEvents/ndvmediaroom1aaaa' under resource group 'MediaServicesRG' was not found. For more details please go to https://aka.ms/ARMResourceNotFoundFix"
//   [28/8/2020 6:38:08 am]   }
//   [28/8/2020 6:38:08 am] }

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('HTTP trigger function processed a request.');

  const liveEventName = req.params.eventName.trim();

  if (liveEventName.length === 0) {
    context.res = errRes('Nothing to see here');
    return;
  }

  try {
    const client = await getAMSClient();

    const liveEvent = await client.liveEvents.get(resourceGroup, accountName, liveEventName);
    if (isError(liveEvent)) {
      throw liveEvent.error;
    }

    const outputs = await getOutputsForEvent(client, liveEvent);

    const body = {
      event: liveEvent.name,
      outputs,
    };

    context.res = {
      body: JSON.stringify(body),
    };
  } catch (err) {
    context.log('Error fetching stream event information', err);
    context.res = errRes('Something went wrong, have you considered asking nicely?');
    return;
  }
};

export default httpTrigger;
