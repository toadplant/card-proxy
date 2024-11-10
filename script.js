const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const path = urlParams.get('path');

console.log(path)

/// COPY LINK MESSAGE
const toastTrigger = document.getElementById('copyBtn');
const toastLiveExample = document.getElementById('liveToast');
const inputElement = document.getElementById('st-link'); // Get the input element

if (toastTrigger) {
  const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample);
  
  toastTrigger.addEventListener('click', () => {
    if (inputElement) {
      // Copy text to clipboard
      navigator.clipboard.writeText(inputElement.value)
        .then(() => {
          // Show toast notification on successful copy
          toastBootstrap.show();
        })
        .catch((error) => {
          console.error("Error copying text: ", error);
        });
    }
  });
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
            format: format,
            fullPath: fullPath,
            version: "main"
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

function addButton(id, buttonText, href) {
    let $button = $('<a>', {
        html: '<i class="bi bi-box-arrow-up-right me-2"></i>' + buttonText,
        id: id,
        href: href,
        class: "btn d-flex btn-outline-light my-2",
        target: "_blank"
    });
    console.log("Button added");
    return $button;
}

function addBadge(text, _class) {
    let $span = $('<span>', {
        class: _class,
        text: text
    });

    return $span
}

///processor fo links in description
function stripChub(text) {
    ///chub or character
    return text.replaceAll(/(https?:\/\/(www\.)?)(characterhub|venus\.chub|chub)\.[a-z]{2,4}\b\//g, '?path=')
}

function addOuterLinks(definition) {
    let janitorCheck = /\[(J|j)anitorai\]\((.*?)\)/g;
    let wywernCheck = /\[(W|w)ywern\]\((.*?)\)/g;

    function containsRegex(definition, regex) {
        console.log("Checking for regex match");
        return regex.test(definition);
    }
    
    if (containsRegex(definition, janitorCheck)) {   
        addButton("janitorai", "Open in Janitor.AI", definition.match(/(?<=\[(J|j)anitorai\]\().*?(?=\))/g)).appendTo($("div#outer-links"));
    }
    if (containsRegex(definition, wywernCheck)) { 
        addButton("wywern", "Open in Wywern", definition.match(/(?<=\[(W|w)ywern\]\().*?(?=\))/g)).appendTo($("div#outer-links"));
    }
}

function addCaiLink(node) {
    if (node.some(label => label.title === "CAI")){
        console.log(node.find(label => label.title === "CAI"))
        let lable =  node.find(label => label.title === "CAI")
        addButton("cai", "Open in C.ai", 
            'https://character.ai/chat/' + lable.description).appendTo($("div#outer-links"));
    }
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
    $('p#metadata').html("Tokens: " + project.nTokens + "<br> Created by " + creator + "<br> Last update: " + project.lastActivityAt.split("T", 1));
    $('#tagline').text(project.tagline);
    $('p#tags').text(tags);
    console.log()
    $('input#st-link').attr('value', project.fullPath);
    
    /// characters processing
    if (project.projectSpace == 'characters') {
        $('img#avatar').attr('src', ("https://avatars.charhub.io/avatars/" + project.fullPath + "/chara_card_v2.png"));
        console.log("it's a character");
        $('div#explainer').text("Import will contain the card of "+project.name+", all embedded and linked lorebooks")
        $('a#lorebooks').text(project.tagline);
        $('a#lorebooks').attr('href', '?path=' + project.fullPath);
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
        $('#imports').text("Lorebooks download is unavailable 😞")
    } else {
        console.log("error");
    }
    $(document).ready(function () {
        console.log(project.description);
        $('div#description').append(marked.parse(stripChub(project.description)));
        addOuterLinks(project.description);
        addCaiLink(project.labels);
    });
    
    
});