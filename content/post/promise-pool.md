---
title: 'Promise Pool'
date: 2022-10-18T09:42:51+08:00
categories: JavaScript
description: 请求池是非常常见的需求，通常是为了限制并发请求数，或者控制带宽。
tags:
    - JavaScript
    - Promise
---

请求池是非常常见的需求，通常是为了限制并发请求数，或者控制带宽。

```javascript
async pool(iterable, concurrency = 10) {
    if (typeof iterable[Symbol.iterator] !== 'function') {
        throw new Error('Invalid iterable')
        return Promise.resolve([])
    }
    const ret = [];
    const executing = new Set();
    for (const item of iterable) {
        const p = Promise.resolve(item)

        ret.push(p);
        executing.add(p);

        const clean = () => executing.delete(p);
        p.finally(clean);
        if (executing.size >= concurrency) {
            await Promise.race(executing);
        }
    }
    return Promise.all(ret);
}
```

