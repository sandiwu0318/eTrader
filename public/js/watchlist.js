try {
    const res = await fetch(`/api/1.0/stock/getNews?symbol=${symbol}`);
    const resJson = (await res.json()).data;
    resJson.map(i => createListWithLink(`${i.title} | ${i.author} | ${i.time}`,i.link));
} catch (err) {
    console.log("price fetch failed, err");
}