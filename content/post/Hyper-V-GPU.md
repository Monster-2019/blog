---
title: 'Hyper-V虚拟机A卡GPU直通'
date: 2024-05-11T22:26:42+08:00
description: 将宿主机的GPU挂载到Hyper-V虚拟机上提高虚拟机性能，解决需要GPU使用的场景。
tags:
    - Hyper-V
    - AMD
---

**重要提醒：AMD 驱动必须 24.3.1 版本及以下**

---

Hyper-V 和 VM 相比就差在 GPU 上，VM 在 GPU 的加持下，目前依旧是更多人的虚拟机首选。Hyper-V 在直通 GPU 后，性能与 VM 差距更小，并且 Hyper-V 的原生性，更便捷。

#### 先在虚拟机中挂载 GPU 设备

```ps1
$vm = "M3"

Add-VMGpuPartitionAdapter -VMName $vm

Set-VMGpuPartitionAdapter -VMName $vm -MinPartitionVRAM 80000000 -MaxPartitionVRAM 100000000 -OptimalPartitionVRAM 100000000 -MinPartitionEncode 80000000 -MaxPartitionEncode 100000000 -OptimalPartitionEncode 100000000 -MinPartitionDecode 80000000 -MaxPartitionDecode 100000000 -OptimalPartitionDecode 100000000 -MinPartitionCompute 80000000 -MaxPartitionCompute 100000000 -OptimalPartitionCompute 100000000

Set-VM -GuestControlledCacheTypes $true -VMName $vm

Set-VM -LowMemoryMappedIoSpace 1Gb -VMName $vm

Set-VM -HighMemoryMappedIoSpace 32GB -VMName $vm
```

上述代码：我们将为虚拟机名称为 M3 的机器添加 GPU 分区并设置相关 GPU 参数。我们只需要修改$vm 即可。使用此脚本时需要确保虚拟机已关闭。

#### 将 GPU 驱动文件复制到虚拟机中安装

我们在完成第一步时，虽然我们在设备管理器中已经能够看到 GPU，但它还缺少驱动文件所以无法工作。我们需要的文件如下：

```
# C:\Windows\SysWOW64\.
│ amdadlx32.dll
│ amdave32.dll
│ amdgfxinfo32.dll
│ amdihk32.dll
│ amdlvr32.dll
│ amdpcom32.dll
│ amdsacli32.dll
│ amdxc32.dll
│ amf-mft-mjpeg-decoder32.dll
│ amfrt32.dll
│ atiadlxx.dll
│ atiadlxy.dll
│ atiapfxx.blb
│ aticfx32.dll
│ atidxx32.dll
│ atieah32.exe
│ atigktxx.dll
│ atimpc32.dll
│ atisamu32.dll
│ ativvsva.dat
│ ativvsvl.dat
```

```
# C:\Windows\System32\.
│ amdadlx64.dll
│ amdave64.dll
│ amdgfxinfo64.dll
│ amdihk64.dll
│ AMDKernelEvents.man
│ amdlvr64.dll
│ amdmiracast.dll
│ amdpcom64.dll
│ amdsacli64.dll
│ amdsasrv64.dll
│ amdsmi.exe
│ amdxc64.dll
│ amdxc64.so
│ amd_comgr.dll
│ amf-mft-mjpeg-decoder64.dll
│ amfrt64.dll
│ ati2erec.dll
│ atiadlxx.dll
│ atiapfxx.blb
│ aticfx64.dll
│ atidemgy.dll
│ atidxx64.dll
│ atieah64.exe
│ atieclxx.exe
│ atig6txx.dll
│ atimpc64.dll
│ atimuixx.dll
│ atisamu64.dll
│ atiumd6a.cap
│ ativvsva.dat
│ ativvsvl.dat
│ dir.txt
│ hiprt02000_amd.hipfb
├─AMD #Dir
└─HostDriverStore
    └─FileRepository
        └─uXXXXXXX.inf_amd64_c5d9584367e4b5ff #Dir
```

上述名称就是相关目录的相关驱动文件，基本上都是新增的。需要注意的是 HostDriverStore 和 FileRepository 文件夹需要自己创建，uXXXXXXX.inf_amd64_c5d9584367e4b5ff 可以在设备管理器的驱动文件详情里找到的 u 开头类似的文件，将它放在刚创建的目录里。AMD 和 uXXXXXXX.inf_amd64_c5d9584367e4b5ff 都不需要修改什么。将这些文件移动到虚拟机里同样的目录下即可。

完成上述步骤后重启就可以从设备管理器中看到正常工作了。在 Direct X 中也是正常的。

因为我只有 A 卡，所有该方法仅适用于 A 卡用户。该方法参考了 [Easy-GPU-PV](https://github.com/jamesstringerparsec/Easy-GPU-PV)。它可以通过脚本实现创建虚拟机到 GPU 直通。但很多配置都是英语配置还需要修改所以并不是无痛的。
