# 实现一个 mini 版本的 vue，实现响应式和双向绑定

我们先看看要模拟 vue 实现响应式和双向绑定的一个整体结构图，如下：

![vue结构图](https://raw.githubusercontent.com/Aisen60/minivue/master/img/structure.png)

其中，包含了 5 个模块（5 个类），分别是以及和它们的功能：

- Vue
  - 负责接收初始化的参数
  - 把 data 中的成员注入到 Vue 实例中，并且把转换成 getter 和 setter
  - 负责调用 Observer 对象，监听数据的变化
  - 负责调用 compiler 对象，解析执行和插值表达式
- Observer
  - 负责把 data 中的属性转换成 getter 和 setter
  - 数据变化时发送通知
- Complier
  - 负责编译模板，解析指令和插值表达式
- Dep
  - 收集依赖，存储所有观察者
  - 添加观察者
  - 发送通知
- Watcher
  - 当依赖发生变化后，Dep 会通知所有的观察者，去更新视图

### 前期准备工作

在磁盘中新建一个文件夹，并且在文件夹下新建一个 index.html 文件，在新建一个 js 文件夹，在 js 文件夹下新建上面的 5 个 js 文件。

接着，我们初始化 index.html 文件，写入以下代码：

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>minivue</title>
  </head>

  <body>
    <div id="app">
      <h1>差值表达式</h1>
      <h3>{{ msg }}</h3>
      <h3>{{ count }}</h3>
      <h1>v-text</h1>
      <div v-text="msg"></div>
      <h1>v-model</h1>
      <input type="text" v-model="msg" />
      <input type="text" v-model="count" />
    </div>
    <script>
      let vm = new Vue({
        el: "#app",
        data: {
          msg: "hello vue",
          count: 100,
        },
      });
    </script>
  </body>
</html>
```

我们只模式插值表达式和 2 个指令，分别是 v-text 和 v-model，省略了函数传参的情况。

### 编写 Vue

在模拟 Vue 之前，我们先来看看这个 vm 实例有什么，我们可以到[官网](https://cn.vuejs.org/v2/guide/index.html)上去看，打开 F12,在 console 面板输入 `app`,就可以看到这个实例包含的属性了,如下图：

![image](https://user-images.githubusercontent.com/19791710/87932191-af7c2580-cabd-11ea-9c06-41fb540ddf33.png)

我们可以看到有$options、$data、\$el、message、get message、set message 这几个属性。其中:

- \$options 是存储这个类的默认选项的
- \$data 是选项中 data 的对象
- \$el 是挂载的 dom 元素

我们还看到，vue 实例上有一个 message 属性，并且它有一个 getter 和 setter 方法，这个 message 属性在\$data 中也有。

那接下来，我们开始编写这个类，打开 vue.js 文件，写入以下代码：

```javaScript
class Vue {
  constructor(options) {
    // 1、通过属性保存选择数据
    this.$options = options || {};
    this.$data = options.data || {};
    // 判断 options.el 是否是字符串，如果是字符串通过document.querySelector获取，如果不是就直接返回options.el
    this.$el =
      typeof options.el === "string"
        ? document.querySelector(options.el)
        : options.el;
    // 2、把 data 中的成员注入到vue实例中，并且转换成getter和setter
    this._proxyData(this.$data);
  }

  _proxyData(data) {
    // 通过Object.keys方法得到一个数组，并且循环当前这个数组调用Object.defineProperty转换成getter和setter
    Object.keys(data).forEach((key) => {
      Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        get() {
          return data[key];
        },
        set(newValue) {
          // 判断新的值和旧的值是否相同，如果相同不做处理
          if (newValue === data[key]) {
            return;
          }
          data[key] = newValue;
        },
      });
    });
  }
}

```

写完后，我们来校验以下，我们需要在 index.html 引入 vue.js,引入后，我们通过浏览器打开 index.html，打开控制台，切换到 console 面板，输入 vm，可以看到以下内容：

![image](https://user-images.githubusercontent.com/19791710/87934160-18b16800-cac1-11ea-9156-324839281773.png)

我们看到，$options、$data、$el 已经被我们记录下来了，并且$data 中的成员已经被注入到实例中来了，并且已经转换成 getter 和 setter 了。

### 编写 Observer

Observer 的作用是，负责把 data 中的属性转换成 getter 和 setter，并且当数据变化时发送通知。我们先不发送通知，我们先处理把 data 中的属性转换成 getter 和 setter。

打开 observer.js,输入以下代码：

```javaScript
class Observer {
  // 这个构造函数接收一个data参数，这个data就是vue实例中的$data
  constructor(data) {
    // 默认执行一个函数，去解析
    this.walk(data);
  }

  walk(data) {
    // 1、判断data是否是对象
    if (!data || typeof data !== "object") {
      return;
    }
    // 2、遍历data对象的所有属性
    Object.keys(data).forEach((key) => {
      this.defineReactive(data, key, data[key]);
    });
  }
  // 定义响应式成员
  defineReactive(obj, key, value) {
    let that = this;
    // 如果value是对象，把value内部的属性转换成响应式数据
    this.walk(value);
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get() {
        return value;
      },
      set(newValue) {
        if (newValue === value) {
          return;
        }
        value = newValue;
        // 如果 newValue 是对象，设置 newValue 的成员为响应式
        that.walk(newValue);
      },
    });
  }
}

```

未完待续~
