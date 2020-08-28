import * as msRestNodeAuth from '@azure/ms-rest-nodeauth';
import { AzureMediaServices } from '@azure/arm-mediaservices';
import { subscription } from '../env';

export const getAMSClient = async (): Promise<AzureMediaServices> => {
  const { AAD_CLIENT_ID, AAD_CLIENT_SECRET, AAD_TENANT_ID } = process.env;
  const creds = await msRestNodeAuth.loginWithServicePrincipalSecret(AAD_CLIENT_ID, AAD_CLIENT_SECRET, AAD_TENANT_ID);
  return new AzureMediaServices(creds, subscription);
};
