const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const path = urlParams.get('path');

console.log(path)

/// COPY LINK MESSAGE
/*$("button#copyBtn").click(function () {
    let value = $("input#st-link").val();

    navigator.clipboard.writeText(value).then(function () {
        alert('Copied! Use this link to import project in Silly Tavern');
    }).catch(function (error) {
        alert('Failed to copy: ' + error);
    });
});*/

const toastTrigger = document.getElementById('copyBtn')
const toastLiveExample = document.getElementById('liveToast')

if (toastTrigger) {
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample)
  toastTrigger.addEventListener('click', () => {
    toastBootstrap.show()
  })
}

/// get project json
async function fetchData() {
    try {
        const json = await $.getJSON("https://api.chub.ai/api/" + path);
        return json;
    } catch (error) {
        console.log("error", error);
    } finally {
        console.log("complete");
    }
}

/// get character card
function downloadCard(format, fullPath, fileName) {
    let extension;
    let responseType = "json"; // Default response type for JSON

    if (format === "card_spec_v2") {
        extension = ".png";
        responseType = "blob"; // Change responseType to 'blob' for binary data (PNG)
    } else if (format === "cai") {
        extension = ".json";
    }

    $.ajax({
        url: "https://api.chub.ai/api/characters/download",
        type: "POST",
        contentType: 'application/json',
        data: JSON.stringify({
            fullPath: fullPath,
            version: "main",
            format: format
        }),
        xhrFields: {
            responseType: responseType // Set response type based on the format
        },
        success: function (response) {
            console.log(response);
            let blob;
            
            if (responseType === "blob") {
                // If response is a blob, use it directly
                blob = response;
            } else {
                // Convert JSON response to blob if format is JSON
                blob = new Blob([JSON.stringify(response)], { type: "application/json" });
            }
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName + extension;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        },
        error: function (error) {
            console.error("Error:", error);
        }
    });
}


// Call fetchData and set the fetched data to the outer variable
fetchData().then((json) => {
    console.log("Fetched project:", json)
    const project = json.node
    const creator = project.fullPath.split("/", 1)[0];
    console.log(creator)
    const tags = project.topics
        .map((item) => {
            return ` #${item.toLowerCase()}`;
        })
    console.log(tags);
    /// project processor
    $('meta[property="og:title"]').attr('content', (project.name + ' by ' + creator.toUpperCase()));
    $('meta[property="og:description"]').attr('content', (project.tagline));
    $('meta[property="og:image"]').attr('content', ("https://avatars.charhub.io/avatars/" + project.fullPath + "/chara_card_v2.png"));
    $('#project-name').text(project.name);
    $('p#metadata').text("Created by " + creator + " | Token size: " + project.nTokens + " | Last update: " + project.lastActivityAt.split("T", 1));
    $('h5#tagline').text(project.tagline);
    $('p#tags').text(tags);
    console.log()
    $('input#st-link').attr('value', project.fullPath);
    
    /// characters processing
    if (project.projectSpace == 'characters') {
        $('img#avatar').attr('src', ("https://avatars.charhub.io/avatars/" + project.fullPath + "/chara_card_v2.png"));
        console.log("it's a character");
        $('div#explainer').text("The file will contain the card of "+project.name+", all embedded and linked lorebooks")
        $('a#lorebooks').text(json.nodes[Object.keys(json.nodes)[0]].tagline);
        $('a#lorebooks').attr('href', '?path=' + json.nodes[Object.keys(json.nodes)[0]].fullPath);
        $('a#agnai').attr('href', "https://agnai.chat/project/create?import=" + project.fullPath);
        $('a#risu').attr('href', "https://risuai.xyz/?charahub=" + project.fullPath);
        $('a#open-cai').attr('href', "https://character.ai/chat/" + project.labels[0].description);
        $('a#get-json').click(function () {
            console.log("starting to download")
            downloadCard("cai", project.fullPath, project.name)
        })
        $('a#get-png').click(function () {
            console.log("starting to download")
            downloadCard("card_spec_v2", project.fullPath, project.name)
        })
    
    /// lorebooks processing
    } else if (project.projectSpace == 'lorebooks') {
        console.log("it's a lorebook");
        
        $('img#avatar').attr('src', project.avatar_url);
        $('div#import-buttons').remove()
        $('#lorebooks').remove()
        $('a#get-png').remove()
    } else {
        console.log("error");
    }
    $(document).ready(function () {
        console.log(project.description);
        let changedText = project.description.replaceAll(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b\//g, '?path=');
        console.log(changedText);

        $('div#description').append(marked.parse(changedText));
    });
    
    
});

/// use internal links for lorebooks and characters

