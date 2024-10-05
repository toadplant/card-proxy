const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const botId = urlParams.get('botId');

console.log(botId)


$(document).ready(function () {
    $("button#copyBtn").click(function() {
        let value = $("input#st-link").val();

        navigator.clipboard.writeText(value).then(function () {
            alert('Copied! Use this link to import character in Silly Tavern');
        }).catch(function (error) {
            alert('Failed to copy: ' + error);
        });
    });
});


$(document).ready(function () {
    $.getJSON(
        "https://api.chub.ai/api/characters/" + botId,
        function (result) {
            console.log(result)
            const character = result.node
            const creator = character.fullPath.split("/", 1)[0];
            const tags = character.topics
                .map((item) => {
                    return ` #${item.toLowerCase()}`;
                })
            const lorebooks = character.related_lorebooks
                .map((lorebook) => {
                    return result.nodes[lorebook].tagline
                })
            console.log(tags)
            png_download =
                $('meta[property="og:title"]').attr('content', (character.name + ' by ' + creator.toUpperCase()));
            $('meta[property="og:description"]').attr('content', (character.tagline));
            $('meta[property="og:image"]').attr('content', ("https://avatars.charhub.io/avatars/" + character.fullPath + "/chara_card_v2.png"));
            $('#character-name').text(character.name);
            $('img#avatar').attr('src', ("https://avatars.charhub.io/avatars/" + character.fullPath + "/chara_card_v2.png"));
            $('p#metadata').text("Created by " + creator + " | Token size: " + character.nTokens + " | Last update: " + character.lastActivityAt.split("T", 1));
            $('h5#tagline').text(character.tagline);
            $('p#tags').text(tags);
            $('a#lorebooks').text(lorebooks);
            $('div#description').append(marked.parse(character.description));
            $('input#st-link').attr('value', character.fullPath);
            $('a#agnai').attr('href', "https://agnai.chat/character/create?import=" + character.fullPath);
            $('a#risu').attr('href', "https://risuai.xyz/?charahub=" + character.fullPath);
            $('a#open-cai').attr('href', "https://character.ai/chat/" + character.labels[0].description);
        });
})