---
title: 'VUE3 el-upload上传阿里云封装'
date: 2023-01-10T14:02:49+08:00
description: 封装el-upload上传到阿里云OSS，开箱即用
categories:
    - Element-Plus
    - Vue3
---

封装 el-upload 上传到阿里云 OSS，开箱即用。

### 效果图

![image](https://monster.aiur.site/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20230110144006.png)

---

![Image](https://monster.aiur.site/%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20230110144120.png)

### ali-oss 配置

我们先安装 ali-oss

```
npm install ali-oss
```

因为我们 oss 配置是从接口获取的，所以要用单例获取配置，避免每次引入组件都调用接口。

```javascript
// upload.js

import OSS from 'ali-oss'

const ossClient = async () => {
    const res = await fetch('/XXX')
    const { result } = await res.clone().json()
    const client = new OSS({
        region: 'oss-cn-shanghai',
        accessKeyId: result.AccessKeyId,
        accessKeySecret: result.AccessKeySecret,
        stsToken: result.SecurityToken,
        bucket: 'XXX'
    })
    return client
}

class SingleInstance {
    instance

    static async getInstance() {
        if (!this.instance) this.instance = await ossClient()

        return this.instance
    }
}

let client = await SingleInstance.getInstance()

export default client
```

在第一次引入的时候就生成了一次 ali-oss 实例，后续使用就都返回这个实例，不再调用接口了。

### 组件代码

#### Template

```html
<template>
    <el-upload
        ref="upload"
        :file-list="fileList"
        :list-type="type === 'image' ? 'picture-card' : 'text'"
        class="custom-uploader"
        :class="fileList.length === limit ? 'hide' : ''"
        action=""
        :accept="allowAccept"
        :limit="limit"
        :multiple="multiple"
        :show-file-list="showList"
        :on-exceed="handleExceed"
        :on-success="handleSuccess"
        :on-remove="handleRemove"
        :http-request="handleUpload"
        :on-preview="handlePreview"
        :before-upload="handleBeforeUpload"
    >
        <el-icon v-if="type === 'image'"><Plus /></el-icon>
        <el-button v-else type="primary" v-show="type !== 'image'">{{ label }}</el-button>
    </el-upload>

    <el-dialog v-model="dialogVisible" top="50px">
        <img w-full :src="dialogImageUrl" alt="Preview Image" />
    </el-dialog>
</template>
```

type 根据不同类型文件显示不同的文件列表风格和按钮风格。dialog 用来预览图片。

#### Script 部分

只说明核心内容部分，完整代码在最后。

**引入相关库**

```typescript
import OSS from 'ali-oss'
import { v4 } from 'uuid'
import Sortable from 'sortablejs'
import client from './upload'
```

**Props**

```typescript
const props = defineProps({
    modelValue: {
        // 双向绑定更改数据
        type: [String, Array], // 如果单文件可以使用字符串，上传多个时使用数组
        default: ''
    },
    accept: {
        // 上传文件类型
        type: String,
        default: () => 'image'
    },
    limit: {
        // 最大上传数量
        type: Number,
        default: () => 1
    },
    multiple: {
        // 是否多选
        type: Boolean,
        default: () => true
    },
    label: {
        // 非图片时按钮文本
        type: String,
        default: () => '上传文件'
    },
    showList: {
        // 是否显示文件列表
        type: Boolean,
        default: () => false
    },
    type: {
        // 上传类型 控制ui风格
        type: String,
        default: () => 'image'
    },
    originName: {
        // 上传文件名是否使用原名，默认用uuid避免重名
        type: Boolean,
        default: () => false
    },
    drag: {
        // 是否可拖拽修改顺序
        type: Boolean,
        default: () => false
    }
})
```

避免直接修改数据源，我们内部定义变量接收

```typescript
interface File {
    uid: Number
    status: String
    name: String
    url: String
}
const fileList = ref<File[]>([])

watch(
    () => props.modelValue,
    (val: String[] | String) => {
        let list: any[] = []
        if (typeof val === 'string' && val) {
            list = [val]
        } else if (Array.isArray(val) && val.length > 0) {
            list = val
        } else {
            list = []
        }
        const res = [...list]
        if (res.length > 0) {
            fileList.value = res.map((url: string) => {
                const uid = new Date().getTime()
                return {
                    uid,
                    status: 'success',
                    name: window.decodeURI(url.slice(url.lastIndexOf('/') + 1)),
                    url: url
                }
            })
        }
    },
    { immediate: true, deep: true }
)
```

el-upload 文件列表是数组类型，所以如果是单文件的字符串，我们需要包裹成数组，同时它们属于已经上传的，所以为他们初始化相应的属性。

**自定义上传**

```typescript
const handleUpload = async (config: any) => {
    try {
        const {
            file,
            file: { uid }
        } = config
        const point = file.name.lastIndexOf('.')
        const ext = file.name.substr(point)
        const fileName = file.name.substring(0, point)
        const date = new Date()
        const curDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
        const path = `/${curDate}/${props.originName ? fileName : v4().replace(/-/g, '')}.${ext}`
        return await client.put(path, file)
    } catch (error) {
        ElMessage.error(typeof error === 'string' ? error : JSON.stringify(error))
        return false
    }
}
```

自定义文件路径和名称，再使用 ali-oss 上传，路径规则：年/月/日/uuid 文件名，返回 oss 的 url

**上传成功处理**

```typescript
const uploadPool = ref<string[]>([])
const selectFileLength = ref<number>(0)

const handleBeforeUpload = () => {
    selectFileLength.value = selectFileLength.value + 1
}

const handleSuccess = (file: any) => {
    let { url } = file
    uploadPool.value.push(url)
    if (upload.value.uploadFiles.find((file: any) => file.status !== 'success')) {
        return
    }
    const value = props.multiple ? [...fileList.value.map(v => v.url), ...uploadPool.value] : url
    emit('change', value)
    emit('update:modelValue', value)
    upload.value.clearFiles()
    uploadPool.value = []
    selectFileLength.value = 0
}
```

因为 el-upload 的事件都是以单个文件触发的，所以我们使用 uploadPool 临时存储已上传数据，在全部完成后一起更新。

element-plus 2.0.0 版本后 el-upload 实例不返回 uploadFiles 了，所以无法获取选择的文件数量，我们使用前置钩子 before-upload 来统计选择文件数量。

**拖拽排序**

```typescript
watch(
    () => props.drag,
    val => {
        if (val && props.limit > 1) rowDrag()
    },
    { immediate: true }
)

const rowDrag = () => {
    nextTick(() => {
        const el = upload.value.$el.querySelector('.el-upload-list')
        Sortable.create(el, {
            onEnd: ({ newIndex, oldIndex }: any) => {
                fileList.value.splice(newIndex, 0, fileList.value.splice(oldIndex, 1)[0])
                const cp = [...fileList.value]
                const value = cp.map(t => t.url)
                emit('change', value)
                emit('update:modelValue', value)
            }
        })
    })
}
```

当最大上传数量大于 1 时，我们才能使用拖拽。拖拽使用的是 sortablejs 库，具体用法请看[Sortable 文档](https://sortablejs.github.io/Sortable/)

### 完整代码

{{< code language="vue" title="Upload.vue" id="1" expand="Show" collapse="Hide" isCollapsed="true" >}}

<template>
    <el-upload
        ref="upload"
        :file-list="fileList"
        :list-type="type === 'image' ? 'picture-card' : 'text'"
        class="custom-uploader"
        :class="fileList.length === limit ? 'hide' : ''"
        action=""
        :accept="allowAccept"
        :limit="limit"
        :multiple="multiple"
        :show-file-list="showList"
        :on-exceed="handleExceed"
        :on-success="handleSuccess"
        :on-remove="handleRemove"
        :http-request="handleUpload"
        :on-preview="handlePreview"
        :before-upload="handleBeforeUpload"
    >
        <el-icon v-if="type === 'image'"><Plus /></el-icon>
        <el-button v-else type="primary" v-show="type !== 'image'">{{ label }}</el-button>
    </el-upload>

    <el-dialog v-model="dialogVisible" top="50px">
        <img w-full :src="dialogImageUrl" alt="Preview Image" />
    </el-dialog>

</template>

<script lang="ts" setup>
import OSS from 'ali-oss'
import { v4 } from 'uuid'
import { ref, watch, defineProps, defineEmits, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadInstance, UploadFile, UploadFiles } from 'element-plus'
import Sortable from 'sortablejs'
import client from './upload'

const ACCEPT = {
    image: 'image/*',
    excel: '.xlsx,.xls,.csv',
    audio: 'audio/*'
}

const emit = defineEmits(['change', 'update:modelValue'])

const props = defineProps({
    modelValue: {
        type: [String, Array],
        default: ''
    },
    accept: {
        type: String,
        default: () => 'image'
    },
    limit: {
        type: Number,
        default: () => 1
    },
    multiple: {
        type: Boolean
    },
    label: {
        type: String,
        default: () => '上传文件'
    },
    showList: {
        type: Boolean,
        default: () => false
    },
    type: {
        type: String,
        default: () => 'image'
    },
    originName: {
        type: Boolean,
        default: () => false
    },
    drag: {
        type: Boolean,
        default: () => false
    }
})

const allowAccept = computed(() => {
    return props.accept in ACCEPT ? ACCEPT[props.accept] : props.accept || ''
})

const upload = ref<UploadInstance>()
const selectFileLength = ref<number>(0)
const uploadPool = ref<string[]>([])

interface File {
    uid: Number
    status: String
    name: String
    url: String
}
const fileList = ref<File[]>([])

watch(
    () => props.modelValue,
    (val: string[] | String) => {
        let list = []
        if (typeof val === 'string' && val) {
            list = [val]
        } else if (Array.isArray(val) && val.length > 0) {
            list = val
        } else {
            list = []
        }
        const res = [...list]
        if (res.length > 0) {
            fileList.value = res.map((url: string) => {
                const uid = new Date().getTime()
                return {
                    uid,
                    status: 'success',
                    name: window.decodeURI(url.slice(url.lastIndexOf('/') + 1)),
                    url: url
                }
            })
        }
    },
    { immediate: true, deep: true }
)

const rowDrag = () => {
    nextTick(() => {
        const el = upload.value.$el.querySelector('.el-upload-list')
        Sortable.create(el, {
            onEnd: ({ newIndex, oldIndex }: any) => {
                fileList.value.splice(newIndex, 0, fileList.value.splice(oldIndex, 1)[0])
                const cp = [...fileList.value]
                const value = cp.map(t => t.url)
                emit('change', value)
                emit('update:modelValue', value)
            }
        })
    })
}

watch(
    () => props.drag,
    val => {
        if (val && props.limit > 1) rowDrag()
    },
    { immediate: true }
)

const handleBeforeUpload = () => {
    selectFileLength.value = selectFileLength.value + 1
}

const handleSuccess = (file: any) => {
    let { url } = file
    uploadPool.value.push(url)
    if (uploadPool.value.length < selectFileLength.value) return
    const value = props.multiple ? [...fileList.value.map(v => v.url), ...uploadPool.value] : url
    emit('change', value)
    emit('update:modelValue', value)
    upload.value.clearFiles()
    uploadPool.value = []
    selectFileLength.value = 0
}
const handleRemove = (uploadFile: UploadFile, uploadFiles: UploadFiles) => {
    const { url } = uploadFile || {}
    let i = fileList.value.findIndex(item => item.url === url)
    if (i >= 0) {
        fileList.value.splice(i, 1)
        const value = props.multiple ? [...fileList.value.map(v => v.url)] : ''
        emit('change', value)
        emit('update:modelValue', value)
    }
}
const handleUpload = async (config: any) => {
    try {
        const {
            file,
            file: { uid }
        } = config
        const point = file.name.lastIndexOf('.')
        const ext = file.name.substr(point)
        const fileName = file.name.substring(0, point)
        const date = new Date()
        const curDate = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
        const path = `/${curDate}/${props.originName ? fileName : v4().replace(/-/g, '')}.${ext}`
        return await client.put(path, file)
    } catch (error) {
        ElMessage.error(typeof error === 'string' ? error : JSON.stringify(error))
        return false
    }
}

const dialogImageUrl = ref<string>('')
const dialogVisible = ref<boolean>(false)
const handlePreview = (uploadFile: any) => {
    dialogImageUrl.value = uploadFile.url
    dialogVisible.value = true
}
const handleExceed = (file: any) => {
    ElMessage.warning('超过最大上传数量，请重新选择')
}
</script>
<style scoped>
.custom-uploader.hide /deep/ .el-upload--picture-card {
    transition: 0s;
    display: none;
}
.el-dialog img {
    max-width: 100%;
}
.custom-uploader /deep/ .el-upload-list__item {
    transition: none !important;
}
</style>

{{< /code >}}

### 组件使用

```
import Upload from './Upload.vue';

<Upload accept="image" showList v-model="value" /> // 上传图片

<Upload accept="audio" showList originName type="audio" v-model="value" /> // 上传非图片
```
