import { AzureFunction, Context, HttpRequest } from '@azure/functions';

import * as msRestNodeAuth from '@azure/ms-rest-nodeauth';
import { AzureMediaServices, AzureMediaServicesModels } from '@azure/arm-mediaservices';

const {
  // AAD_TENANT_DOMAIN,
  AZURE_MEDIA_SERVICES_ACCOUNT_NAME: accountName,
  // AZURE_MEDIA_SERVICES_LOCATION,
  AZURE_MEDIA_SERVICES_RESOURCE_GROUP: resourceGroup,
  AZURE_MEDIA_SERVICES_SUBSCRIPTION: subscription,
  // ARM_AAD_AUDIENCE,
  // ARM_ENDPOINT,
  AZURE_MEDIA_SERVICES_STREAM_ENDPOINT: streamEndpoint,
} = process.env;

const getAMSClient = async (): Promise<AzureMediaServices> => {
  const { AAD_CLIENT_ID, AAD_CLIENT_SECRET, AAD_TENANT_ID } = process.env;
  const creds = await msRestNodeAuth.loginWithServicePrincipalSecret(AAD_CLIENT_ID, AAD_CLIENT_SECRET, AAD_TENANT_ID);
  return new AzureMediaServices(creds, subscription);
};

const getLocatorPaths = async (client: AzureMediaServices, locatorName: string) => {
  const { streamingPaths } = await client.streamingLocators.listPaths(resourceGroup, accountName, locatorName);

  return streamingPaths.map(({ paths, streamingProtocol, encryptionScheme }) => ({
    paths: paths.map((pathsEntry) => `${streamEndpoint}${pathsEntry}`),
    streamingProtocol,
    encryptionScheme,
  }));
};

const getLocatorsForOutput = async (client: AzureMediaServices, output: AzureMediaServicesModels.LiveOutput) => {
  const locators = await client.assets.listStreamingLocators(resourceGroup, accountName, output.assetName);

  return Promise.all(
    locators.streamingLocators.map(async (locator) => ({
      locator,
      paths: await getLocatorPaths(client, locator.name),
    })),
  );
};

const getOutputsForEvent = async (client: AzureMediaServices, event: AzureMediaServicesModels.LiveEvent) => {
  return Promise.all(
    (await client.liveOutputs.list(resourceGroup, accountName, event.name)).map(async (output) => ({
      output,
      locators: await getLocatorsForOutput(client, output),
    })),
  );
};

/* , {
    environment: {
      activeDirectoryResourceId: ARM_AAD_AUDIENCE,
      resourceManagerEndpointUrl: ARM_ENDPOINT,
    },
  } as AzureTokenCredentialsOptions */

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  try {
    const client = await getAMSClient();

    const liveEvents = await client.liveEvents.list(resourceGroup, accountName);

    const liveOutputs = await Promise.all(
      liveEvents.map(async (event) => ({
        event,
        outputs: await getOutputsForEvent(client, event),
      })),
    );

    const output = {
      liveOutputs,
    };

    context.res = {
      // status: 200, /* Defaults to 200 */
      body: `${JSON.stringify(output)}`,
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
