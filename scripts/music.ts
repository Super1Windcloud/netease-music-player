import axios from 'axios'

async function search(keyword: string) {
	const url = 'https://2024.myfreemp3juices.cc/api/api_search.php'

	const params = {
		callback: 'jQuery21305380994749348686_1765263508483', // 可换成动态
	}

	const data = new URLSearchParams()
	data.append('q', keyword) // ← 这里需要你提供实际参数名称

	const res = await axios.post(url, data, {
		params,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'X-Requested-With': 'XMLHttpRequest',
			Referer: 'https://2024.myfreemp3juices.cc/',
			Origin: 'https://2024.myfreemp3juices.cc',
			'User-Agent': 'Mozilla/5.0',
			Cookie: `musicLang=en; cf_clearance=z5Uq3f3KGVv0jgaN6SpMawpFkEKBy4lkfeX13iEheqg-1765263020-1.2.1.1-UGtYNyfQARxfYF5I6Wh8UQ2rQQ_vF59JQfoW7aENbiEAN09.MGI0OtuK1ntqRn0ni2gsjqlQZFsic1UYHwLnKPXieqV.uUL99EzOdKllszxr8OTuLAgotW5FI6XWsiy8m2mT.TIaU1ws.cUbYsveEUalgjSKPIW4QrztpBnnkqBh64QzpLLi9LIGndbz5DdplbHwB7vqzl2pkKUhMStG5V.xBlrUyF0VVPBvbyIJpXQ`,
		},
	})

	return res.data
}

search('周杰伦').then(console.log)
