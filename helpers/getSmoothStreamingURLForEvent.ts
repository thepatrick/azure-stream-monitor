import { AzureMediaServices } from '@azure/arm-mediaservices';
import { accountName, resourceGroup, streamEndpoint } from '../env';

type StreamOffline = {
  streaming: 'offline';
  error: Error;
};

type StreamLive = {
  streaming: 'live';
  streamURL: string;
};

type StreamResponse = StreamOffline | StreamLive;

export const getSmoothStreamingURLForEvent = async (
  client: AzureMediaServices,
  liveEventName: string,
): Promise<StreamResponse> => {
  const outputs = await client.liveOutputs.list(resourceGroup, accountName, liveEventName);

  const output = outputs.find(
    (output) => output.provisioningState === 'Succeeded' && output.resourceState === 'Running',
  );

  if (!output) {
    return {
      streaming: 'offline',
      error: new Error('No output in provisioningState Succeeded and resourceState Running'),
    };
  }

  const locators = await client.assets.listStreamingLocators(resourceGroup, accountName, output.assetName);

  const locator = locators.streamingLocators.find(
    ({ streamingPolicyName }) => streamingPolicyName === 'Predefined_ClearStreamingOnly',
  );

  if (!locator) {
    return {
      streaming: 'offline',
      error: new Error('No locator with streamingPolicyName Predefined_ClearStreamingOnly'),
    };
  }

  const { streamingPaths } = await client.streamingLocators.listPaths(resourceGroup, accountName, locator.name);

  const smoothStreamingPaths = streamingPaths.find(
    ({ streamingProtocol, encryptionScheme }) =>
      streamingProtocol === 'SmoothStreaming' && encryptionScheme === 'NoEncryption',
  );

  if (!smoothStreamingPaths) {
    return {
      streaming: 'offline',
      error: new Error(
        'No streaming paths found for streamingProtocol SmoothStreaming and encryptionScheme NoEncryption',
      ),
    };
  }

  const streamPath = smoothStreamingPaths.paths[0];

  if (!streamPath) {
    return { streaming: 'offline', error: new Error('No path found for stream') };
  }

  const streamURL = `${streamEndpoint}${streamPath}`;

  return { streaming: 'live', streamURL };
};
