import mimetypes
import logging

logger = logging.getLogger(__name__)

def ForceInlineImageMiddleware(get_response):
  def middleware(request):
    response = get_response(request)
    logger.warning(f"[MIDDLEWARE HIT] Image path: {request.path}")

    if request.path.startswith("/media/"):
        content_type, _ = mimetypes.guess_type(request.path)
        if content_type and content_type.startswith("image/"):
            del response.headers["Content-Disposition"]
            response["Content-Type"] = content_type
            response["Content-Disposable"] = "inline"
    return response
  logger.warning(f"[MIDDLEWARE loaded]")
  return middleware


