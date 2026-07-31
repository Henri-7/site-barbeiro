export function notFound(_request, _response, next) {
  const error = new Error('Rota não encontrada.');
  error.status = 404;
  error.code = 'NOT_FOUND';
  next(error);
}
