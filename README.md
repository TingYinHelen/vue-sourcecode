<p align="center"></p>

<p align="center">

</p>

## 执行的流程

<p>
    从npm script可以看出，dev环境执行的是build/config.js文件中web-full-dev下的 entry,作为项目的入口。
    然后走web-runtime-with-compiler.js引入import Vue from './web-runtime'
    然后引入核心代码import Vue from 'core/index'
</p>

## 数据绑定原理图

<p align="center">
    <img width="400px" src="https://mmbiz.qpic.cn/mmbiz_png/JNB6ic5PBMj83SLZny6GCmw2ib2RLBEJaEKQiaicw3QyrwofDEAhEgpGEBKC2CmFtRvuPS8L2RI6bYbxkRLmRYwdlA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1">
    <div>
        <a href="http://www.jianshu.com/p/51e5eaf438e7">用void 0替代undefined</a>
    </div>
</p>


