const express = require("express");
const line = require("@line/bot-sdk");
const fs = require("fs");
const { parse } = require("csv-parse/sync");
const { url } = require("inspector");

const PORT = process.env.PORT || 3000;

// LINE
const config = {
  channelSecret: "fc2c543b69aa332842acd5d8eb83cf70",
  channelAccessToken:
    "fywygz3vYmhToNrEE8VomjgMPY79gdJCuN2/+w5L5KrdqhRC/zrN/iaH8upulGFyFiJPr1zxuCFctSzNpaGC7LHPFW8Zl/J50M26DCfv+KYyBiCesiIhUKINL+7SIItuoevWJpoedUgFEUAtEcMFNQdB04t89/1O/w1cDnyilFU=",
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

const data = fs.readFileSync("UB_spot.csv");
const records = parse(data);

// FlexMessageを作る関数を分離した．ここでは変数を入れ込んでるだけ
function createFlexMsg(spot, city, detail, photo, site) {
  return {
    type: "carousel",
    contents: [
      {
        type: "bubble",
        hero: {
          type: "image",
          url: photo,
          size: "full",
          aspectRatio: "20:13",
          aspectMode: "cover",
        },
        body: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "text",
              text: spot,
              weight: "bold",
              size: "xl",
            },
            {
              type: "box",
              layout: "vertical",
              margin: "lg",
              spacing: "sm",
              contents: [
                {
                  type: "box",
                  layout: "baseline",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: city,
                      color: "#666666",
                      size: "lg",
                      flex: 1,
                    },
                  ],
                },
                {
                  type: "box",
                  layout: "vertical",
                  spacing: "sm",
                  contents: [
                    {
                      type: "text",
                      text: "詳細",
                      color: "#aaaaaa",
                      size: "sm",
                      flex: 1,
                    },
                    {
                      type: "text",
                      text: detail,
                      wrap: true,
                      color: "#666666",
                      size: "sm",
                      flex: 5,
                    },
                  ],
                },
              ],
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          spacing: "sm",
          contents: [
            {
              type: "button",
              style: "link",
              height: "sm",
              action: {
                type: "uri",
                label: "WEBSITE",
                uri: site,
              },
            },
            {
              type: "box",
              layout: "vertical",
              contents: [],
              margin: "sm",
            },
          ],
          flex: 0,
        },
      },
    ],
  };
}

// ここでメッセージへの応答を処理します
async function handleEvent(event) {
  if (event.type == "message" || event.message.type == "text") {
    console.log(event.message.text);

    let message = event.message.text;

    for (const record of records) {
      if (record[0] == message) {
        spot = record[1];
        city = record[2];
        detail = record[3];
        photo = record[4];
        site = record[5];
        break;
      }
    }
    if (records.some((record) => record[0] == message)) {
      // 都道府県名が存在する場合
      const spots = records.filter((record) => record[0] == message);

      // ランダムに観光スポットを選択する
      const spot = spots[Math.floor(Math.random() * spots.length)];

      //   console.log(spot[1]);
      //   const gmap = "https://www.google.com/maps/place/" + spot[1];
      //   console.log(gmap);
      //mapのURL
      // FlexMessageを作成して返信する
      const flexMsg = createFlexMsg(
        spot[1],
        spot[2],
        spot[3],
        spot[4],
        spot[5]
      );

      replyMsg = { type: "flex", altText: "hoge", contents: flexMsg };
    } else {
      // 一致するものがなければ、以下のようなメッセージを返す
      replytext = "その都道府県のおすすめ観光スポットはありません";
      replyMsg = { type: "text", text: replytext };
    }

    await client.replyMessage(event.replyToken, replyMsg);
  } else {
    return;
  }
}

app.listen(PORT);
console.log("run");
