(() => {
  const lessons = window.ShuLessons ||= {};
  // All diagrams share the work surface's 100 × 100 coordinates with the trace points.
  const line=(d,col='#9d795a',w=1.4)=>'<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round"/>';
  const band=(x,y,w,h,col)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="1.6" fill="'+col+'"/>';
  const loom=band(9,21,82,5,'#b18862')+band(9,75,82,5,'#b18862')+
    Array.from({length:13},(_,i)=>line('M'+(15+i*5.8)+' 25v50',i%2?'#c69155':'#c16152',.85)).join('');
  const shed=line('M7 56 L48 30 L92 55 M7 56 L48 71 L92 55','#997958',2)+
    line('M7 58 L47 33 L92 57 M7 58 L47 74 L92 57','#c89568',1);
  const silk=band(9,21,82,59,'#f3e4cb')+
    Array.from({length:8},(_,i)=>line('M12 '+(26+i*7)+'h76','#d3bd98',.55)).join('')+
    Array.from({length:11},(_,i)=>line('M'+(15+i*7)+' 24v52','#d3bd98',.55)).join('');
  const margin=band(6,10,7,79,'#a27852')+band(26,13,57,73,'#efe1ca')+
    line('M26 17v65','#aa9271',1)+line('M15 12v76','#75553d',1);
  const eye=band(62,23,3,60,'#78817b')+'<ellipse cx="63.5" cy="35" rx="4" ry="7.5" fill="#f8ecd6" stroke="#67736e" stroke-width="2"/>';
  const flower=silk+line('M27 70 Q16 47 35 30 Q52 11 76 24 Q94 43 70 60 Q51 76 27 70Z','#bc737b',1.8)+
    line('M27 70 Q40 52 60 42 M29 70 Q54 57 73 32','#d9a29e',1);
  const cutaway=band(8,49,84,5,'#dcc4a1')+line('M8 48h84 M8 55h84','#ac9478',.85);
  const buried=silk+Array.from({length:10},(_,i)=>line('M'+(19+i*5.7)+' 63 l18 -25',i%2?'#cc8490':'#a65a6a',2.7)).join('');
  lessons.jin={
    question:'转到织机侧面：哪一组吊线带起经线，哪一排细齿把横穿过来的纬线推向锦面？',
    parts:[
      {name:'经轴',detail:'机后横轴放出经线。沿一根彩线向前看，它会穿过综眼、筘齿，接到已织的锦面。'},
      {name:'提综',detail:'吊绳牵起综框，综眼里的那组经线随之升高，另一组留在下层，两层之间就是梭口。'},
      {name:'梭子',detail:'尖头木梭的凹槽里有纬管。梭身从经线中间穿过，管上的丝线就留下一道纬。'},
      {name:'筘',detail:'一排细齿分隔经线。摆近织口时，筘把刚引入的纬线推紧在上一纬旁边。'},
      {name:'锦面',detail:'经纬交织后在机前成布。下方的卷布轴收走织好的部分，让织口留在手能够到的位置。'}
    ],
    stages:[
      {title:'张紧经线',observe:'看机后的经轴，沿彩线找向织口。松经在两个支点之间下垂，张紧后才容易分层。',operations:[
        {type:'trace',prompt:'从机后向织口理顺一根经线，沿纵向走，不要横跨邻线。',tool:'经线',points:[[50,26],[50,42],[50,59],[50,74]],diagram:loom,feedback:'这根线沿布长方向走，是经线。'},
        {type:'range',prompt:'收紧经轴，把模型的张紧刻度调到 60–72%，让经线平直但仍有余量。',min:0,max:100,start:20,target:[60,72],unit:'%',diagram:loom,feedback:'经线已张平，下一步提综时可以看清上下两层。'}]},
      {title:'提综开口',observe:'侧看两组综眼。只提选中的一组，另一组经线留在低处，梭子才有通路。',operations:[
        {type:'sequence',prompt:'排出一次开口的传动次序：先有哪一个动作，最后看到什么？',options:['综眼带起经线','牵动提综绳','形成上下两层'],order:[1,0,2],diagram:shed,feedback:'提综绳牵动综眼，穿在眼里的经线才随之抬起。'},
        {type:'trace',prompt:'沿吊绳向上提起综框，直到两层经线之间的梭口张开。',tool:'提综绳',points:[[48,69],[48,55],[48,42],[48,29]],diagram:shed,feedback:'一组经线抬起，侧面出现了梭子可以通过的开口。'}]},
      {title:'投梭引纬',observe:'看梭身两端和中间的纬管。一次横穿只留一纬；回投前，要把这一纬打紧，再换一组经线升起。',operations:[
        {type:'trace',prompt:'送出第一梭：让梭尖从左边沿梭口水平走到右边。',tool:'梭子',points:[[13,51],[36,51],[61,51],[86,51]],diagram:loom,feedback:'纬线从管上退绕，横穿了经线。'},
        {type:'trace',prompt:'模型先打紧上一纬、交换梭口。接住右侧的梭子，再沿新梭口送回左边。',tool:'回梭',points:[[86,57],[61,57],[36,57],[13,57]],diagram:loom,feedback:'第二道纬从相反方向穿过，布边留下连续的回折。'}]},
      {title:'打纬成锦',observe:'从侧面转到机前看，刚回投的纬与锦边之间还有空隙；筘要从后向前把它推到织口。',operations:[
        {type:'trace',prompt:'握住筘座朝织口摆动，让刚投过的纬线紧贴上一纬。',tool:'筘座',points:[[48,31],[48,46],[49,58],[51,70]],diagram:loom+band(13,71,74,5,'#ba6357'),feedback:'筘齿带着新纬向锦边靠拢，经纬交织处变密了。'},
        {type:'range',prompt:'将这次收卷调到模型刻度 32–44%，使新织的锦段越过卷布轴。',min:0,max:100,start:5,target:[32,44],unit:'%',diagram:loom+band(8,68,85,10,'#ad7556'),feedback:'锦布绕过前轴，织口前又有了继续投梭的空间。'}]}
    ]
  };
  lessons.xiu={
    question:'从侧面看软缎、针和两面的针迹：针从哪里穿过？换到背面，能看见同一朵芙蓉吗？',
    parts:[
      {name:'卷绷杆',detail:'上下两根横杆固定绣地两端；配合左右的绷绳，把软缎四边拉平。'},
      {name:'侧边绷绳',detail:'绷绳往返于绣边与侧杆之间。各段受力相近，花样才不会因局部拉紧而偏斜。'},
      {name:'软缎',detail:'正面和背面属于同一层绣地。针在缎上穿进、穿出，生成两面的针迹。'},
      {name:'绣针',detail:'丝线穿过针尾的针眼。针尖先穿缎，随后针身和丝线才被带到另一面。'},
      {name:'丝线',detail:'托盘上线轴分装着不同颜色的丝线。花瓣用邻近的深浅色，枝叶另配绿色。'},
      {name:'正面针迹',detail:'沿花瓣生长方向安排针脚，让相邻色线长短错开，颜色的交界便柔和下来。'},
      {name:'背面针迹',detail:'转到绣架背后就能看到这一面。线穿过同一层缎，线尾藏在已有针脚里。'}
    ],
    stages:[
      {title:'绷紧绣面',observe:'看两侧折返的绷绳，再侧看缎面。四周用力均匀，中央的松弛才会一点点消失。',operations:[
        {type:'trace',prompt:'从绣边绕到侧杆，再回到下一处绣边，连续绕两次。',tool:'绷绳',points:[[27,24],[13,35],[27,47],[13,59],[27,71]],diagram:margin,feedback:'侧边的绷绳把拉力分到相邻的绣边。'},
        {type:'range',prompt:'调节卷绷杆，把模型张力放在 58–70%，看中央褶皱展平。',min:0,max:100,start:15,target:[58,70],unit:'%',diagram:silk,feedback:'软缎平展了，针落下时花样不会跟着皱起来。'}]},
      {title:'引丝穿针',observe:'找针尾的小孔。针尖用来穿缎，只有针尾的针眼能带住丝线。',operations:[
        {type:'choice',prompt:'花瓣已经有深红和浅粉两端，要在中间添一层过渡，选哪束线？',options:['墨绿叶线','中间色的玫粉丝','金黄花蕊线'],answer:1,diagram:flower,feedback:'在这张花样里，玫粉丝能接住邻近的深红与浅粉。'},
        {type:'trace',prompt:'把线头从左侧送进针眼，穿过后向右下方留一小截线尾。',tool:'丝线头',points:[[16,35],[40,35],[63,35],[76,36],[85,47]],diagram:eye,feedback:'线头已越过针眼，绣针移动就能带着丝线走。'}]},
      {title:'晕色铺针',observe:'先在剖面里看一针怎样出入同一块缎，再回到正面。芙蓉的花瓣从内向外舒展，丝线也顺着这个方向铺。',operations:[
        {type:'trace',prompt:'剖面示意：从缎下出针，沿花瓣铺过一段，再从另一处入针到缎下。',tool:'绣针',points:[[25,70],[25,50],[27,35],[52,29],[73,37],[75,51],[75,69]],diagram:cutaway,feedback:'一个出针点和一个入针点之间，正面留下一道针脚。'},
        {type:'trace',prompt:'换相邻色线，从花瓣根部顺着瓣纹铺向浅色区，让针脚插进上一层的空隙。',tool:'晕色针',points:[[32,65],[43,56],[55,45],[68,35],[75,31]],diagram:flower,feedback:'针向顺着花瓣，深浅两层交错衔接，色带的边界变柔了。'}]},
      {title:'收针藏线',observe:'把绣架转到背面，放大看针脚之间的空隙。末端可以顺着已有针脚藏入，再剪去露出的余线。',operations:[
        {type:'trace',prompt:'在背面沿着已有针脚下方送入针尖，依次穿过这段密针，把线尾带进去。',tool:'藏线针',points:[[24,59],[38,55],[52,50],[67,45],[78,43]],diagram:buried,feedback:'线尾藏进已有针脚，背面不会悬着一截长线。'},
        {type:'choice',prompt:'剪去露出的余线前，翻看两面。哪种结果可以收工？',options:['背面留一枚凸起的大结','正面出现一道跨瓣的长浮线','两面平整，轻理针脚也不见松尾'],answer:2,diagram:buried,feedback:'藏线稳妥，两面都留住了完整的芙蓉纹样。'}]}
    ]
  };
})();
