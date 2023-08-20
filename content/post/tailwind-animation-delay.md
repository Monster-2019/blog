---
title: 'Tailwind 生成动态 Animation Delay 实用类'
date: 2023-08-20T22:04:18+08:00
description: 通过 Tailwind matchUtilities 函数生成动态 Animation Delay 实用类
tags:
    - tailwind
    - css
---

Tailwind CSS 中默认只有 Transition Delay，但我们的需求是实现 Animation Delay，既然使用了 Tailwind CSS，我们就尽量避免写 style，通过 Tailwind CSS 提供的 matchUtilities 函数实现。

接下来我们开始实现动态 Animation Delay：

#### Plugin 函数

Plugin 函数有两个参数，一是 PluginCreator，就是我们使用 matchUtilities 添加动态实用类的函数，二是 plguin 配置。

#### PluginCreator

PluginCreator 函数有很多辅助函数，我们这里只需要使用 matchUtilities 和 theme 两个。

```javascript
plugin(
    function ({ matchUtilities, theme }) {
        matchUtilities(
            {
                'animation-delay': value => {
                    return {
                        'animation-delay': value + 'ms'
                    }
                }
            },
            {
                values: theme('animationDelay')
            }
        )
    }
    // ... config
}
```

在 PluginCreator 中直接调用 matchUtilities 创建动态实用类，matchUtilities 也有两个参数。

1. 动态实用类对象，key 是动态实用类静态部分，例如: transition-delay-[100]的 transition-delay，value 可以是字符串 css 规则也可以是函数，如何是函数，值则是中括号中的 100，然后返回相关的 css 规则。
2. css 规则相关配置

    - respectPrefix: boolean // 是否考虑前缀
    - respectImportant: boolean // 是否考虑!important 声明
    - type: ValueType | ValueType[] // 单个类型或类型数组
    - values: KeyValuePair<string, T> // 键值对
    - supportsNegativeValues: boolean // 是否支持负值

    我们使用 theme 函数获取主题中 animationDelay 的键值对，将它们应用到 animation-delay 函数中，生成相应的 css 规则。

#### Plugin 配置

```javascript
// tailwind.config.js
plugin(
    // ... PluginCreator
    {
        theme: {
            animationDelay: {
                100: '100',
                200: '200',
                300: '300',
                400: '400',
                500: '500'
            }
        }
    }
)
```

这步我们将配置默认的主题样式，它们的区别在于，如果配置了 theme 样式，我们 class 可以写成这样 animation-delay-100，就会应用 animation-delay: 100ms;这个样式，如果没有配置 theme，则我们 class 要写成这样 animation-delay-[100]，中括号不能丢。只有配置了主题样式才能抛弃中括号。

#### 最终代码

```javascript
import plugin from 'tailwindcss/plugin'

export default {
    // ... 其他配置

    plugins: [
        plugin(
            function ({ matchUtilities, theme }) {
                matchUtilities(
                    {
                        'animation-delay': value => {
                            return {
                                'animation-delay': value + 'ms'
                            }
                        }
                    },
                    {
                        values: theme('animationDelay')
                    }
                )
            },
            {
                theme: {
                    animationDelay: {
                        100: '100',
                        200: '200',
                        300: '300',
                        400: '400',
                        500: '500'
                    }
                }
            }
        )
    ]

    // ... 其他配置
}
```

只有你使用到这个样式才会生成 CSS 规则文件，并不会将所有配置的主题都生成样式文件。例如我使用了 animation-delay-300 和 animation-delay-[600]，则我们的 style 文件中将只包含下面代码：

```css
.animation-delay-300 {
    animation-delay: 300ms;
}
.animation-delay-\[600\] {
    animation-delay: 600ms;
}
```
