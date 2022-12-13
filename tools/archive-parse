// JS Archive.org -> RTV converter
// Note: sorting is determined by Archive.org and may need intervention

TITLE = prompt("Archive.org Item ID\nCollections are not supported", "electricsheep-flock-248-2500-0")
response = await fetch(`https://archive.org/metadata/${TITLE}`).then(a=>a.json())

// TODO: Collections
if (response.metadata.mediatype === "collection") {
    console.log("Collections are unsupported.")
    return 1
}

playlist = JSON.stringify({
  info: {
    name: response.metadata.title,
    "url_prefix": `https://archive.org/download/${response.metadata.identifier}/`
  },
  playlist:
    response.files
      .filter(file => file.format==="h.264" || file.format==="MPEG4")
      .map(file => (
        {
          "name": file.name.match(/^(?=.*\/)?(.*)\.\w{3,4}$/)[1],
          "duration": Math.round(file.length),
          "qualities": [{"src": file.name}]
        }
      ))
})

console.log(playlist)
copy(playlist)
prompt("",playlist)
