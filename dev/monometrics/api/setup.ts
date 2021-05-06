import * as http from "http"
import * as url from "url"

export default (req: http.IncomingMessage, res: http.ServerResponse) => {
  const next = new URL(req.url).searchParams.get("next")
  res.writeHead(302, "success", {
    Location: next,
  })
  res.end()
}
