---
title: 'Flutter Dio 请求封装，干净便利的获取数据'
date: 2024-09-16T21:46:49+08:00
description: '前端友好的Flutter Dio 请求封装方式，干净便利的获取数据'
tags:
    - Flutter
    - Dio
---

请求封装在项目中是非常有必要的，可以统一处理请求授权、结果返回、错误处理等，好的封装可以有效提高开发效率，减少冗余代码。下面我们就开始封装 Flutter Dio，获取接口数据。

## 1. 使用单例模式

```dart
class DioClient {
    DioClient._()
    static final DioClient _instance = DioClient._();
    factory DioClient() {
        return _instance;
    }
}
```

单例模式可以让我们所有地方都引用一个实例，公用 Dio 配置。

## 2. 实例化 Dio

```dart
class DioClient {
    DioClient._()
    static final DioClient _instance = DioClient._();
    factory DioClient() {
        return _instance;
    }

    final Dio _dio = Dio(
        BaseOptions(
            baseUrl: dotenv.get("BASE_URL"),
            connectTimeout: const Duration(seconds: 10),
            contentType: Headers.jsonContentType,
        ),
    )
}
```

-   baseUrl: 请求基本地址
-   connectTimeout: 请求超时事件
-   contentType：请求类型，和 Header 中的 contentType 相同

其他常用配置

-   extra：请求中包含的自定义对象
-   headers：请求头
-   responseType：相应类型，如果 contentType 设置为 JSON，响应会自动处理为 JSON 对象

## 3. Dio 拦截器

```dart
class DioClient {
    DioClient._()
    static final DioClient _instance = DioClient._();
    factory DioClient() {
        return _instance;
    }

    static Dio get dio => _instance._dio;

    final Dio _dio = Dio(
        BaseOptions(
            baseUrl: "https://xxxxxx.xxx",
            connectTimeout: const Duration(seconds: 10),
            contentType: Headers.jsonContentType,
        ),
    )..interceptors.add(
      InterceptorsWrapper(
        onRequest:
            (RequestOptions options, RequestInterceptorHandler handler) async {
          return handler.next(options);
        },
        onResponse: (Response response, ResponseInterceptorHandler handler) {
          final responseData = response.data as Map<String, dynamic>;

          if (response.statusCode == 200) {
            return handler.resolve(Response(
              requestOptions: response.requestOptions,
              data: responseData,
              statusCode: response.statusCode,
              statusMessage: response.statusMessage,
            ));
          } else {
            return handler.reject(DioException(
              message: responseData.toString(),
              requestOptions: response.requestOptions,
            ));
          }
        },
        onError: (DioException error, ErrorInterceptorHandler handler) async {
          final responseData = error.response!.data as Map<String, dynamic>;
          final dioException = DioException(
            requestOptions: error.requestOptions,
            message: responseData["error"],
          );
          return handler.reject(dioException);
        },
      ),
    );
}
```

向 Dio 实例的 interceptors 添加一个 InterceptorsWrapper，它包含以下三个参数

#### onRequest

接受两个参数，RequestOptions 和 RequestInterceptorHandler。

RequestOptions 包含请求体和请求参数等信息，可以在这里转换请求数据和设置授权请求头。

handler 类似 JS Promise，有 resolve 方法响应数据，reject 方法抛出错误，还有一个 next 方法，类似中间件，如果有下一个拦截器，则继续执行。

#### onResponse

接受两个参数，Response 和 ResponseInterceptorHandler（同上）。

Response 常用属性：

-   data：接口返回的数据
-   requestOptions：请求配置
-   statusCode：响应状态码
-   statusMessage：响应消息
-   headers：响应头

这里可以处理响应数据，返回你想要的数据或格式。handler.resolve 接受一个 Response 对象，requestOptions 是必须的，其他的可以自定义。

#### onError

接受两个参数，DioException 和 ResponseInterceptorHandler（同上）。

DioException 常用属性：

-   requestOptions：请求配置
-   response：响应体
-   type：错误类型
-   message：错误消息

可以使用在这里使用 handler.reject 抛出错误，reject 接受 DioException 对象，requestOptions 是必须的，其他的可以自定义。

## 4. 配置授权请求头

```dart
class DioClient {
    DioClient._internal(this._tokenManager);
    static final DioClient _instance = DioClient._internal(TokenManager());
    final TokenManager _tokenManager;
    ...
}
```

```dart
onRequest: (RequestOptions options, RequestInterceptorHandler handler) async {
    options.headers["authorization"] =
        "Bearer ${_instance._tokenManager.accessToken}";
    return handler.next(options);
},
```

上述的\_tokenManager 是一个使用了单例模式的类，用于管理 token，在这里获取到的 accessToken 始终是最新的。tokenManager 实现如下：

```
// token_manager.dart
class TokenManager {
  TokenManager._();

  String _accessToken = "";
  String _refreshToken = "";

  static final TokenManager _instance = TokenManager._();

  factory TokenManager() {
    return _instance;
  }

  Future<void> initialize() async {
    if (await checkAccessToken()) {
      _accessToken = await SecureStorage.read("accessToken");
    }
    if (await checkRefreshToken()) {
      _refreshToken = await SecureStorage.read("refreshToken");
    }
  }

  ... 其他方法
}
```

TokenManager 如上所示，在 main 函数调用 await TokenManager().initialize()初始化，它将从 flutter_secure_storage 获取存储的 accessToken 和 refreshToken。让用户无需重新登录。你也可以使用其他方式管理 token，比如 Provider，SecureStorage 直接读取使用。

## 5. 实现 token 刷新

```dart
onError: (DioException error, ErrorInterceptorHandler handler) async {
    final responseData = error.response!.data as Map<String, dynamic>;
    final dioException = DioException(
        requestOptions: error.requestOptions,
        message: responseData["error"],
    );
    if (error.response?.statusCode == 401) {
        if (error.requestOptions.path == "/refreshToken") {
            SecureStorage.deleteAll();
            _instance._tokenManager.clean();
            router.go("/login");
            return;
        }
        try {
            Map<String, dynamic> data = {
            "refreshToken": _instance._tokenManager.refreshToken
            };
            UserRefreshModel response =
                await UserApiService.refreshToken(data);
            await _instance._tokenManager.setAccessToken(response);
            error.requestOptions.headers["authorization"] =
                "Bearer ${_instance._tokenManager.accessToken}";
            return handler.resolve(await dio.fetch(error.requestOptions));
        } catch (e) {
            SecureStorage.deleteAll();
            _instance._tokenManager.clean();
            router.go("/login");
        }
    }
    return handler.reject(dioException);
},
```

如果错误码是 401，则证明 token 失效，那么我们则通过 refreshToken 获取新的 accessToken，更新 tokenManager 中的 accessToken，error.requestOptions 中保留着我们上一次发送的请求配置，我们修改 token 再发送请求并返回数据即可。因为请求 refreshToken 接口也是基于该 Dio 实例的，所以它如果失败也会触发 onError 回调，将会导致无限循环。所以我们要判断请求是否是 refreshToken，如果是则清空 token 和存储，跳转到 Login 页面。

## 6. 使用封装的 Dio

因为 Flutter 不能像 JS 一样便利的按需引入，所以我们使用 class 来分类和管理接口，我们以登录接口为例

```user_service.dart
import "package:dio/dio.dart";
import 'package:xxx/models/user_model.dart';

import './dio_service.dart';

class UserApiService {
  static Future<UserTokenModel> login(Map<String, dynamic> data) async {
    final Response response = await DioClient.dio.post("/login", data: data);
    return UserTokenModel.fromJson(response.data);
  }

  ...
}
```

定义 UserApiService 类，它将管理我们所有与用户有关的接口，然后将各个接口定义为静态方法便于调用。Flutter 推崇使用 Model 来管理数据，提高可维护性和可读性。我们可以在这一步通过定义的 Model 将 JSON 格式的数据转换为 Dart 对象，方便与 UI 交互。这里推荐使用 [quicktype](https://app.quicktype.io/) 将 JSON 数据快速转换为对应的 Model。

接下来我们在 Login 页面中使用它

```dart
import 'package:xxx/models/user_model.dart';
import 'xxx/user_service.dart';

...

Future<void> login() async {
    final Map<String, dynamic> data = {
        "email": emailTextController.text,
        "password": passwordTextController.text,
    };

    try {
        final UserTokenModel response = await UserApiService.login(data);
        await tokenManager.loginSetToken(response);
    } catch (e) {
        if (e is DioException && mounted) {
            SnackBarHelper.showErrorSnackBar(context, e.message.toString());
        }
    }
}

...
```

上面我们导入 UserApiService，然后调用 login 方法进行登录获取 token，然后进行后续操作。通过 try catch 捕获错误，在 onError 中我们会返回一个 DioException 错误，它包含一个 message 错误消息，SnackBarHelper.showErrorSnackBar 是对 showSnackBar 的封装，我将通过 showSnackBar 展示这条错误消息。
