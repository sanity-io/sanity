import * as http from "http"

export default (req: http.ClientRequest, res: http.ServerResponse) => {
    let data = '';
    req.on('data', chunk => {
        data += chunk;
    })
    req.on('end', () => {
        console.log(data)
        res.end();
    })
}
