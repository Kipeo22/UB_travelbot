const express = require("express");
const line = require("@line/bot-sdk");
const fs = require("fs");
const { parse } = require("csv-parse/sync");

const PORT = process.env.PORT || 3000;

const config = {
  channelSecret: "<<<<あなたのやつに置き換えて>>>>",
  channelAccessToken: "<<<<あなたのやつに置き換えて>>>>",
};

const app = express();
app.get("/", async (_, res) => {
  return res.status(200).end();
});

app.post("/webhook", line.middleware(config), async (req, res) => {
  await Promise.all(
    req.body.events.map(async (event) => {
      try {
        await handleEvent(event);
      } catch (err) {
        console.log(err);
        return res.status(500).end();
      }
    })
  );
  return res.status(200).end();
});

const client = new line.Client(config);

const data = fs.readFileSync("kitchen_car_11.csv");
const records = parse(data);

// FlexMessageを作る関数を分離した．ここでは変数を入れ込んでるだけ
function createFlexMsg(date, name_1, name_2) {
  return {
    type: "carousel",
    contents: [
      {
        type: "bubble",
        size: "kilo",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "12月" + date + "日",
            },
            {
              type: "text",
              text: name_1,
              weight: "bold",
              size: "xxl",
              wrap: true,
              align: "center",
            },
          ],
          spacing: "sm",
          paddingAll: "13px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              action: {
                type: "uri",
                uri: "https://goo.gl/maps/F6DAL4Fm996rcD1B7",
                label: "１号館前",
              },
              style: "secondary",
            },
          ],
        },
      },
      {
        type: "bubble",
        size: "kilo",
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: "11月" + date + "日",
            },
            {
              type: "text",
              text: name_2,
              weight: "bold",
              size: "xxl",
              wrap: true,
              align: "center",
            },
          ],
          spacing: "sm",
          paddingAll: "13px",
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              action: {
                type: "uri",
                label: "セントラルガーデン",
                uri: "https://goo.gl/maps/3vU9H8Gyf5dup8so6",
              },
              style: "secondary",
            },
          ],
        },
      },
    ],
  };
}

// ここでメッセージへの応答を処理します
async function handleEvent(event) {
  if (event.type == "message" || event.message.type == "text") {
    console.log(event.message.text);

    let gettext = event.message.text;
    let replyMsg = {};
    let replytext = "";
    let flexMsg = {};

    // 正規表現を使ってパターンマッチングしています
    switch (true) {
      case /おはよう/.test(gettext):
        replytext = "おはようございます！";
        replyMsg = { type: "text", text: replytext };
        break;
      case /こんにちは/.test(gettext):
        replytext = "こんにちは〜！";
        replyMsg = { type: "text", text: replytext };
        break;
      case /おやすみ/.test(gettext):
        replytext = "もう寝ちゃうの？";
        replyMsg = { type: "text", text: replytext };
        break;
      case /([1-9]|[12][0-9]|3[01])日/.test(gettext):
        let match_date = gettext.match(/([1-9]|[12][0-9]|3[01])日/);
        let find_flag = false;
        for (const record of records) {
          if (record[0] == "2023/11/" + match_date[1]) {
            if (record[2] == "") {
              replytext = "その日にキッチンカーは来ないよ";
              break;
            } else {
              find_flag = true;
              flexMsg = createFlexMsg(match_date, record[2], record[3]);
              break;
            }
          }
        }
        if (find_flag == true) {
          replyMsg = { type: "flex", altText: "hoge", contents: flexMsg };
        } else {
          replytext = "何かがおかしい";
          replyMsg = { type: "text", text: replytext };
        }
        break;
      default:
        replytext = "ごめん，よくわからない";
        replyMsg = { type: "text", text: replytext };
        break;
    }
    await client.replyMessage(event.replyToken, replyMsg);
  } else {
    return;
  }
}
app.listen(PORT);
console.log("run");
