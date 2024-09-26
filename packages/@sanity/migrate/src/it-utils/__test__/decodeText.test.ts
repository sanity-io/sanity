import {expect, test} from 'vitest'

import {decodeText} from '../decodeText'
import {toArray} from '../toArray'

const encoder = new TextEncoder()

const str = [
  '載ウルフホ権行エヌカク日対ぼれ途権うつじば面川ソニ禁碁ッ脅詳いク提場ノ継検ム聞権もおな辞女れかまひ守就ごどす爆白ヒ体91捜ルッば集作ソモネ相生どほ三5竜宿則廟びる。欲帯げ引寺ぱリ帯屋十ヘシニラ戒量ア耐部面ちさ特見離ロ政変1界がょせぞ向度そおまご劇選モヘ上抱動ゃわ認者キメセミ図午品漫ぜま。',
  '香国モツホ家済びづじ下法ドぽけえ巨供ユ続読ざるドさ検公ざ条詳ヒロハ升氏ハ協会テ明襲ス本索ヨアネラ問83希譜助ゃ水果当号財ょのッね。麻ケイロ動閣りすを受済文節ぞゃく例略ラ方6宿クトリマ存動ヌテチツ聞可ん月諭安しド体入タ胆外90因おぽでち玲料反念ぱ。手すばゃん護込ほ社道断ーへふや著拠フさーず版年ル遣告ン勤投ッのる可解ぐむそび房類ロニヨ僚25王4護刊キ担注拍らゃの。',
  '終ユテカ委死クょ見4老ドご絶実ぴそ院地ロホ将6駆セホヲヒ欠式ユリフヲ変打ド延職測池闘へや態発サノエ作形近偵ぜ。結求牛ムホ馬56牧風みよ刑一アメニナ医講つみクづ手通問戸にかド転集べひレ衛壁政普河つにイク。演ぜょべし海殿カヲヱラ留出レドほ報憲こ異記ネノ過頁作こぐぶ賢田キ社推エラス勢92政ねラご台簿ンび府制モツニケ合瞥てさょ手発かぞリな精7第カシヱト桑企リソナ原贈マ隅局っょろ岐東め。',
  '権都案入ねつろ春垣予昇よほせ注高テ含初ツチフ社組アスサ手裁っは煙国ミオウ索写セヱウ市錦ごでレ捕必ゅさた海歩こく材自え番真ラア能委ゃせ全投交まさドで。除ヌコ揮市チ件合つさきラ参約クキユ報注ホモスク卒片64明キセツロ水約療きぱ学行う捕界ヲソケク組43都と真5禁ゃいル更理よて立政ねい記83覧働迎2乞ゅスり。',
].join('')

const bytes = encoder.encode(str)

async function* chunk(array: Uint8Array, chunkSize: number) {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize)
  }
}

test('decodeText() works with chunks of multibyte unicode strings', async () => {
  const decoded = await toArray(decodeText(chunk(bytes, 10)))
  expect(decoded.join('')).toEqual(str)
})
