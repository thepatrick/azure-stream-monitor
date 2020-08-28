import { AzureMediaServices } from '@azure/arm-mediaservices';
import { EncryptionScheme, StreamingPolicyStreamingProtocol } from '@azure/arm-mediaservices/esm/models';
import { accountName, resourceGroup, streamEndpoint } from '../env';

export type StreamOutputLocatorPath = {
  paths: string[];
  streamingProtocol: StreamingPolicyStreamingProtocol;
  encryptionScheme: EncryptionScheme;
};

export const getLocatorPaths = async (
  client: AzureMediaServices,
  locatorName: string,
): Promise<StreamOutputLocatorPath[]> => {
  const { streamingPaths } = await client.streamingLocators.listPaths(resourceGroup, accountName, locatorName);

  return streamingPaths.map(({ paths, streamingProtocol, encryptionScheme }) => ({
    paths: paths.map((pathsEntry) => `${streamEndpoint}${pathsEntry}`),
    streamingProtocol,
    encryptionScheme,
  }));
};
