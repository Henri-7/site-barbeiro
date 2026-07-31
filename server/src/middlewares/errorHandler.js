export function errorHandler(error, _request, response, _next) {
  void _next;
  const status = error.status || 500;
  response.status(status).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: status >= 500 ? 'Não foi possível concluir a operacao agora.' : error.message,
      details: error.details || undefined
    }
  });
}
