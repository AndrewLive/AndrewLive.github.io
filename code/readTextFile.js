export async function readTextFile(name) {
    // console.log(`obj/${name}.poly`)
    const polyRequest = new Request(`text/${name}.txt`);
    var returnText = '';
    await fetch(polyRequest)
        .then((response) => response.text())
        .then((text) => {
            returnText = text;
        })

    return returnText;
}