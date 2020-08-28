import { AzureMediaServices, AzureMediaServicesModels } from '@azure/arm-mediaservices';
import { accountName, resourceGroup } from '../env';
import { getLocatorPaths, StreamOutputLocatorPath } from './getLocatorPaths';

export type StreamOutputLocators = {
  locator: AzureMediaServicesModels.AssetStreamingLocator;
  paths: StreamOutputLocatorPath[];
};

export const getLocatorsForOutput = async (
  client: AzureMediaServices,
  output: AzureMediaServicesModels.LiveOutput,
): Promise<StreamOutputLocators[]> => {
  const locators = await client.assets.listStreamingLocators(resourceGroup, accountName, output.assetName);

  return Promise.all(
    locators.streamingLocators.map(async (locator) => ({
      locator,
      paths: await getLocatorPaths(client, locator.name),
    })),
  );
};
