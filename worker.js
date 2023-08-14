import { json } from 'https://pkg.do/apis.do'

export default {
  fetch: req => json(req.cf)
}
