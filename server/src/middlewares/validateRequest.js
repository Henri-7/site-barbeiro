export function validateRequest(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      const error = new Error(result.error.issues[0]?.message || 'Dados inválidos.');
      error.status = 400;
      error.code = 'VALIDATION_ERROR';
      next(error);
      return;
    }

    request.body = result.data;
    next();
  };
}
