<template>
    <dl>
        <dt>
            <h2>使用说明:</h2>
        </dt>
        <dd>1. 资源路径指 “\\10.0.0.3\miebo\美术\插件\新增皮肤\(具体的皮肤文件夹)” 下的路径，例如泡泡，霓虹猫。点击打开按钮即可选取文件夹，也可手动输入文件夹路径。</dd>
        <dd>2. 获取到资源路径后，点击检查，可检查当前路径下的皮肤是否存在，或命名是否规范。</dd>
        <dd>
            3. 主题图片存在必须资源和非必须资源，必须资源指所有主题都共同存在的图片。而非必须资源，指一些具有差异性的主题图片，
            例如:
            “任务进度条/叠加.png”，此资源在一些主题中需要，一些主题中则不需要，故存在差异性。当我们点击检查后会返回一些检查信息，如果必须资源缺少的话，那么复制这个按钮将处于禁止状态。只有当所有必须资源都正确无误时，才能将图片复制到项目中。非必须资源则不影响复制按钮的点击，但如果出现非必须资源不存在问题，需要美术自行确定当前主题是否需要此资源。
        </dd>
        <dd>4. 项目路径指咩播软件项目路径，例如 “D:\my_object_all\desktop”，指定的路径为项目的最外层。（不同开发人员的项目路径不一致，请不要使用上面提供的示例路径）</dd>
        <dd>5. 主题名称就是新主题的英文名，用于拼接出完整的项目路径。</dd>
        <dd>6. 完成上面所有步骤后，点击复制，即可将资源图片，复制到开发项目的对应图片路径下！</dd>
    </dl>
</template>
<script lang='ts' setup>

</script>
<style lang='scss' scoped>
dl {
    min-height: 100vh;
    max-height: 100vh;
    padding: 24px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    letter-spacing: 1px;
    margin: 0;
    overflow-y: auto;

    &::-webkit-scrollbar {
        width: 8px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 4px;

        &:hover {
            background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
        }
    }

    dt {
        margin-bottom: 24px;

        h2 {
            color: #2c3e50;
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            padding: 20px 24px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;

            &::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 4px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 4px 0 0 4px;
            }
        }
    }

    dd {
        margin: 0 0 16px 0;
        padding: 20px 24px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        line-height: 1.6;
        color: #2c3e50;
        font-size: 14px;
        transition: all 0.3s ease;
        position: relative;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.12);
        }

        &:nth-child(even) {
            border-left: 4px solid #52c41a;
        }

        &:nth-child(odd) {
            border-left: 4px solid #1890ff;
        }

        // 为每个步骤添加编号样式
        &::before {
            content: counter(step-counter);
            counter-increment: step-counter;
            position: absolute;
            left: -12px;
            top: -8px;
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
    }
}

// 初始化计数器
dl {
    counter-reset: step-counter;
}
</style>