exports.handler = async (event) => {
  console.log('WhoAmI test route invoked with event:', JSON.stringify(event, null, 2));

  // Extract claims from API Gateway HTTP API JWT authorizer context
  const authorizer = event.requestContext && event.requestContext.authorizer;
  const claims = authorizer && authorizer.jwt ? authorizer.jwt.claims : authorizer || {};

  const userId = claims.sub || claims.username || 'unknown';
  const email = claims.email || 'unknown';
  const groups = claims['cognito:groups'] || [];

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      status: 'authenticated',
      user: {
        id: userId,
        email: email,
        groups: Array.isArray(groups) ? groups : [groups],
        rawClaims: claims,
      },
      timestamp: new Date().toISOString(),
    }),
  };
};
