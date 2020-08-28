import { AzureFunction, Context, HttpRequest } from '@azure/functions';

import { accountName, resourceGroup } from '../env';
import { getAMSClient } from '../helpers/getAMSClient';
import { getOutputsForEvent } from '../helpers/getOutputsForEvent';

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  try {
    const client = await getAMSClient();

    const liveEvents = await client.liveEvents.list(resourceGroup, accountName);

    const liveOutputs = await Promise.all(
      liveEvents.map(async (event) => ({
        event: event.name,
        outputs: await getOutputsForEvent(client, event),
      })),
    );

    context.res = {
      // status: 200, /* Defaults to 200 */
      body: `${JSON.stringify(liveOutputs)}`,
    };
  } catch (err) {
    context.res = {
      // status: 200, /* Defaults to 200 */
      body: `Well, that did not go to plan: ${(err as Error).message}`,
    };
  }

  //   context.log('HTTP trigger function processed a request.');
  //   const name = req.query.name || (req.body && req.body.name);
};

export default httpTrigger;
