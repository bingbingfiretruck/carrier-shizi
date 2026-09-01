/* 字库：500 高频字，按书面语频次排序，每 10 字一组 = 一个工作日
   格式：字|例词|场景句（场景句仅虚字/抽象字需要，孩子念整句）
   末尾 4 组是日常高频具体字与工地/航母主题字，作为收尾。*/
var RAW_BANK = [
"的|我的|这是我的","一|一个","是|是的","不|不要","了|好了|吃完了","在|在家|妈妈在家","人|大人","有|有的|我有一个","我|我们","他|他们",
"这|这个","个|一个","们|我们","中|中间","来|过来","上|上面","大|大人","为|因为|因为下雨了","和|和好","国|中国",
"地|地上","到|回到|回到家了","以|可以","说|说话","时|时间","要|要去","就|就来|马上就来","出|出门","会|学会","可|可以",
"也|也好|我也去","你|你好","对|对了","生|生日","能|能干","而|而且|又大而且圆","子|儿子","那|那边","得|得到","于|等于|一加一等于二",
"着|看着|我看着你","下|下面","自|自己","之|之后|吃完之后","年|过年","过|走过","后|后面","作|作业","里|里面","用|有用",
"道|知道","行|不行","所|所以","然|忽然","家|回家","种|一种","事|事情","成|成功","方|方向","多|好多",
"经|已经","去|出去","法|办法","学|上学","如|如果","都|都好|大家都好","同|同学","现|现在","当|当心","没|没有",
"动|运动","面|面条","起|起来","看|看书","定|一定","天|天空","分|分开","还|还有","进|进来","好|好吃",
"小|小狗","部|全部","其|其他","些|一些","主|主人","样|一样","理|道理","心|开心","她|她们","本|一本",
"前|前面","开|打开","但|但是|好吃但是贵","因|因为","只|一只","从|从前","想|想家","实|真实","日|生日","军|军人",
"者|作者","意|意思","无|无敌","力|用力","它|它们","与|参与","长|长大","把|一把","机|飞机","十|十个",
"民|人民","第|第一","公|公园","此|从此","已|已经","工|工人","使|使用","情|事情","明|明天","性|性格",
"知|知道","全|全部","三|三个","又|又大|又大又圆","关|关门","点|一点","正|正好","业|作业","外|外面","将|将来",
"两|两个","高|高兴","间|中间","由|自由","问|问题","很|很好","最|最好","重|很重","并|并且|又高并且壮","物|动物",
"手|小手","应|应该","战|战士","向|方向","头|头发","文|课文","体|身体","冰|冰块","美|美丽","相|相同",
"见|看见","被|被子","利|顺利","什|什么","二|二个","等|等着","产|生产","或|或者","新|新的","己|自己",
"制|制作","身|身体","果|水果","加|加油","西|西瓜","冷|很冷","月|月亮","话|说话","合|合上","回|回家",
"特|特别","代|时代","内|内心","信|写信","表|手表","化|变化","老|老师","给|给我","世|世界","位|一位",
"次|一次","度|温度","门|开门","任|任务","常|常常","先|先来","海|大海","通|通过","教|教室","儿|女儿",
"原|原来","东|东西","声|声音","提|提起","立|站立","及|以及","比|比赛","员|队员","解|解开","水|喝水",
"名|名字","真|真的","论|讨论","处|到处","走|走路","抬|抬起","各|各种","入|入口","几|几个","口|门口",
"认|认识","条|一条","平|平安","系|关系","气|生气","题|问题","活|生活","慢|很慢","更|更好","别|别的",
"打|打球","女|女孩","变|变化","四|四个","神|神气","总|总是","何|如何","电|电话","数|数数","安|安全",
"少|多少","报|报纸","才|刚才","结|结果","反|反正","受|接受","目|目光","太|太阳","量|重量","再|再见",
"感|感谢","建|建造","务|任务","做|做饭","接|接住","必|必须","场|广场","件|一件","计|计划","管|管子",
"期|星期","市|城市","直|一直","热|很热","雪|下雪","命|生命","山|大山","金|金色","指|手指","云|白云",
"许|也许","雨|下雨","区|地区","保|保护","至|至少","队|排队","形|形状","星|星星","便|方便","空|天空",
"决|决定","治|治病","展|发展","马|小马","科|科学","司|公司","五|五个","基|基本","眼|眼睛","书|看书",
"非|非常","则|规则","听|听话","白|白色","却|却是|想去却下雨了","界|世界","达|到达","光|阳光","放|放学","强|强壮",
"即|立即","像|好像","难|很难","且|而且","挖|挖土","思|思考","王|国王","象|大象","完|完成","设|设计",
"式|方式","色|颜色","路|马路","记|记住","南|南边","品|作品","住|住下","告|告诉","类|种类","求|要求",
"据|根据","程|工程","北|北边","边|旁边","死|死了","张|一张","该|应该","交|交给","规|规矩","万|一万",
"取|取出","拉|拉手","格|格子","望|希望","觉|睡觉","术|技术","领|领子","共|一共","确|正确","传|传球",
"师|老师","观|参观","清|清水","今|今天","切|一切","院|医院","让|让开","识|认识","候|时候","带|带走",
"导|领导","争|争气","运|运动","笑|大笑","飞|飞机","风|大风","步|跑步","改|改正","收|收好","根|根本",
"干|干活","造|建造","言|语言","联|联合","持|坚持","组|小组","每|每天","甜|好甜","车|汽车","亲|亲亲",
"极|北极","林|树林","服|衣服","快|很快","办|办法","累|好累","往|往前","元|一元","英|英雄","士|战士",
"证|证明","近|附近","失|失去","转|转身","夫|工夫","令|命令","准|准备","布|布料","始|开始","怎|怎么",
"呢|好呢|你去哪儿呢","存|存钱","未|未来","远|很远","叫|大叫","台|台灯","单|单独","影|电影","具|工具","洞|山洞",
"字|写字","爱|爱心","击|打击","流|流水","备|准备","兵|士兵","连|连接","调|调皮","深|很深","商|商店",
"算|算数","质|质量","团|团结","集|集合","百|一百","需|需要","价|价格","花|花朵","铁|铁块","华|中华",
"城|城市","石|石头","级|年级","整|整齐","灯|电灯","离|离开","况|情况","桶|水桶","请|请坐","技|技术",
"疼|头疼","约|大约","示|表示","复|复习","病|生病","息|休息","究|研究","线|毛线","香|好香","官|五官",
"火|火车","断|断开","精|精神","满|满了","支|一支","视|电视","消|消失","越|越过","器|机器","容|容易",
"照|照片","须|必须","九|九个","增|增加","研|研究","写|写字","称|称呼","净|干净","八|八个","功|成功",
"吨|一吨","严|严格","苦|辛苦","药|吃药","排|排队","优|优秀","阳|太阳","房|房子","早|早上","晚|晚上",
"睡|睡觉","吃|吃饭","喝|喝水","玩|玩具","跑|跑步","跳|跳高","唱|唱歌","画|画画","洗|洗手","穿|穿衣",
"爸|爸爸","妈|妈妈","爷|爷爷","奶|奶奶","哥|哥哥","姐|姐姐","弟|弟弟","妹|妹妹","朋|朋友","友|好友",
"猫|小猫","狗|小狗","鸟|小鸟","鱼|小鱼","虫|虫子","树|大树","草|小草","叶|树叶","菜|青菜","饭|米饭",
"桥|大桥","楼|高楼","船|轮船","港|海港","舰|军舰","甲|甲板","板|木板","砖|砖头","泥|水泥","钢|钢筋"
];

var BANK = RAW_BANK.map(function(line){
  var p = line.split("|");
  return { c: p[0], word: p[1], sentence: p[2] || "" };
});
var CHARS = BANK.map(function(x){ return x.c; });
var BY_CHAR = {};
BANK.forEach(function(x){ BY_CHAR[x.c] = x; });

/* 念的内容：有场景句就念整句，否则念例词 */
function promptTextOf(c){
  var e = BY_CHAR[c];
  if(!e) return c;
  return e.sentence || e.word;
}

/* 500 字的拼音（不带声调），顺序与 RAW_BANK 一致。
   多音字用 / 分隔。用途：语音识别听成同音字时也判对。 */
var RAW_PINYIN = [
"de yi shi bu le/liao zai ren you wo ta",
"zhe ge men zhong lai shang da wei he/huo guo",
"di/de dao yi shuo shi yao jiu chu hui ke",
"ye ni dui sheng neng er zi na de/dei yu",
"zhe/zhuo xia zi zhi nian guo hou zuo li yong",
"dao xing/hang suo ran jia zhong shi cheng fang duo",
"jing qu fa xue ru dou/du tong xian dang mei",
"dong mian qi kan ding tian fen tian jin hao",
"xiao bu qi xie zhu yang li xin ta ben",
"qian kai dan yin zhi cong xiang shi ri jun",
"zhe yi wu li ta yu zhang/chang ba ji shi",
"min di gong ci yi gong shi qing ming xing",
"zhi quan san you guan dian zheng ye wai jiang",
"liang gao jian you wen hen zui zhong/chong bing wu",
"shou ying zhan xiang tou wen ti bing mei xiang",
"jian bei li shen er deng chan huo xin ji",
"zhi shen guo jia xi leng yue hua he hui",
"te dai nei xin biao hua lao gei shi wei",
"ci du men ren chang xian hai tong jiao er",
"yuan dong sheng ti li ji bi yuan jie shui",
"ming zhen lun chu zou tai ge ru ji kou",
"ren tiao ping xi qi ti huo man geng bie",
"da nv bian si shen zong he dian shu an",
"shao bao cai jie fan shou mu tai liang zai",
"gan jian wu zuo jie bi chang jian ji guan",
"qi shi zhi re xue ming shan jin zhi yun",
"xu yu qu bao zhi dui xing xing bian kong",
"jue zhi zhan ma ke si wu ji yan shu",
"fei ze ting bai que jie da guang fang qiang",
"ji xiang nan qie wa si wang xiang wan she",
"shi se lu ji nan pin zhu gao lei qiu",
"ju cheng bei bian si zhang gai jiao gui wan",
"qu la ge wang jiao/jue shu ling gong que chuan",
"shi guan qing jin qie yuan rang shi hou dai",
"dao zheng yun xiao fei feng bu gai shou gen",
"gan zao yan lian chi zu mei tian che qin",
"ji lin fu kuai ban lei wang yuan ying shi",
"zheng jin shi zhuan fu ling zhun bu shi zen",
"ne cun wei yuan jiao tai dan ying ju dong",
"zi ai ji liu bei bing lian tiao shen shang",
"suan zhi tuan ji bai xu jia hua tie hua",
"cheng shi ji zheng deng li kuang tong qing ji",
"teng yue shi fu bing xi jiu xian xiang guan",
"huo duan jing man zhi shi xiao yue qi rong",
"zhao xu jiu zeng yan xie cheng jing ba gong",
"dun yan ku yao pai you yang fang zao wan",
"shui chi he wan pao tiao chang hua xi chuan",
"ba ma ye nai ge jie di mei peng you",
"mao gou niao yu chong shu cao ye cai fan",
"qiao lou chuan gang jian jia ban zhuan ni gang"
].join(" ").split(/\s+/);

/* 字库之外的常用字拼音。语音识别经常吐出这些字，
   有了它们才能认出「水」被听成「谁」「税」这类情况。 */
var EXTRA_PINYIN =
"谁shei/shui 税shui 帅shuai 摔shuai 甩shuai " +
"医yi 衣yi 依yi 移yi 姨yi 疑yi 宜yi 椅yi 议yi 亿yi 易yi 益yi 艺yi 译yi 异yi 仪yi " +
"试shi 势shi 誓shi 拾shi 湿shi 狮shi 诗shi 施shi 驶shi 适shi 释shi 饰shi 逝shi 尸shi " +
"德de 滴di 低di 底di 帝di 敌di 递di 笛di 抵di " +
"乐le/yue 勒le 料liao 疗liao 辽liao 聊liao 撩liao " +
"载zai 栽zai 灾zai 宰zai " +
"仁ren 忍ren 刃ren 韧ren " +
"右you 油you 游you 邮you 幽you 忧you 犹you 尤you 悠you " +
"窝wo 握wo 卧wo 沃wo " +
"塔ta 踏ta 塌ta " +
"吗ma 嘛ma 麻ma 骂ma 码ma 蚂ma " +
"吧ba 疤ba 拔ba 靶ba 坝ba " +
"呀ya 压ya 牙ya 亚ya 鸭ya 芽ya 呐na 拿na 娜na 纳na " +
"啊a 阿a 哦o 噢o 喔o 偶ou 藕ou 呕ou " +
"嗯en 恩en 摁en 诶ei 哎ai 唉ai 挨ai 矮ai 哀ai 爱ai " +
"呗bei 杯bei 背bei 悲bei 倍bei 备bei 贝bei " +
"喽lou 漏lou 陋lou 楼lou " +
"赛sai 塞sai 腮sai 哈ha 蛤ha 嘿hei 黑hei " +
"喂wei 味wei 胃wei 围wei 唯wei 维wei 伟wei 尾wei 卫wei 危wei " +
"哇wa 娃wa 蛙wa 瓦wa 袜wa " +
"您nin 咱zan 赞zan 攒zan 咋za " +
"申shen 伸shen 审shen 婶shen 甚shen 沈shen " +
"啥sha 沙sha 傻sha 杀sha 纱sha " +
"吼hou 猴hou 厚hou 喉hou 侯hou " +
"割ge 歌ge 隔ge 阁ge 鸽ge 革ge 咯ge 胳ge " +
"额e 饿e 鹅e 恶e 俄e " +
"孩hai 害hai 嗨hai " +
"号hao 浩hao 豪hao 毫hao 耗hao " +
"倒dao 岛dao 刀dao 稻dao 蹈dao 悼dao " +
"刊kan 砍kan 坎kan " +
"田tian 添tian 填tian 舔tian " +
"念nian 粘nian 捻nian 碾nian " +
"血xue 靴xue 削xue " +
"答da 搭da 塔da 瘩da " +
"校xiao 效xiao 销xiao 晓xiao 宵xiao 硝xiao " +
"划hua 滑hua 哗hua " +
"扯che 撤che 彻che " +
"肥fei 费fei 废fei 匪fei 沸fei " +
"鸡ji 急ji 挤ji 寄ji 季ji 迹ji 纪ji 既ji 稽ji 姬ji " +
"够gou 沟gou 构gou 购gou 钩gou " +
"毛mao 帽mao 冒mao 貌mao 茅mao " +
"语yu 育yu 遇yu 玉yu 域yu 预yu 愈yu 誉yu 郁yu 御yu " +
"尿niao 输shu 熟shu 属shu 述shu 舒shu 叔shu 束shu 疏shu " +
"操cao 曹cao 槽cao 材cai 财cai 猜cai 踩cai 彩cai 裁cai " +
"翻fan 烦fan 凡fan 范fan 犯fan 帆fan 繁fan " +
"货huo 获huo 伙huo 祸huo 惑huo " +
"闪shan 扇shan 善shan 衫shan 珊shan " +
"阅yue 岳yue 悦yue " +
"澡zao 灶zao 糟zao 遭zao 枣zao 燥zao " +
"弯wan 湾wan 碗wan 挽wan 腕wan 顽wan";

var PY = {};
CHARS.forEach(function(c, i){ PY[c] = RAW_PINYIN[i] || ""; });
EXTRA_PINYIN.split(/\s+/).forEach(function(item){
  if(item.length < 2) return;
  var c = item.charAt(0);
  if(!PY[c]) PY[c] = item.slice(1);
});

/* 同音判定：两个字只要有一个读音相同就算同音 */
function sharePinyin(a, b){
  if(!a || !b) return false;
  var A = a.split("/"), B = b.split("/");
  for(var i = 0; i < A.length; i++) if(B.indexOf(A[i]) >= 0) return true;
  return false;
}
