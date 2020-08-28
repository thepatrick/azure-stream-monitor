import { AzureMediaServices, AzureMediaServicesModels } from '@azure/arm-mediaservices';
import { accountName, resourceGroup } from '../env';
import { getLocatorsForOutput, StreamOutputLocators } from './getLocatorsForOutput';

export type StreamOuptut = {
  output: AzureMediaServicesModels.LiveOutput;
  locators: StreamOutputLocators[];
};

export const getOutputsForEvent = async (
  client: AzureMediaServices,
  event: AzureMediaServicesModels.LiveEvent,
): Promise<StreamOuptut[]> => {
  return Promise.all(
    (await client.liveOutputs.list(resourceGroup, accountName, event.name)).map(async (output) => ({
      output,
      locators: await getLocatorsForOutput(client, output),
    })),
  );
};
