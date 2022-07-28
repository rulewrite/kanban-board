export const unsubscribeErrorHandler = (error: any) => {
  if (error instanceof Error && error.message === 'stop is not a function') {
    return;
  }

  throw error;
};
