<template>
    <article class="file-message" :data-type="type">
        <div class="file-check-info" v-for="item, index of paths" :key="index" :class="{
            'optional-fail': type === 'fail' && item.text.includes('非必须资源')
        }">
            <span class="index-number">{{ index + 1 }}.</span>
            <span class="file-path" :style="{ color: textColor }">{{ item.path }}</span>
            <span class="file-text">{{ item.text }}</span>
        </div>
    </article>
</template>

<script lang='ts' setup>
interface FileMessageProps {
    textColor: string;
    paths: { path: string, text: string }[];
    type: "success" | "fail";
}

defineProps<FileMessageProps>();
</script>

<style lang='scss' scoped>
.file-message {
    display: flex;
    justify-content: flex-start;
    flex-wrap: wrap;
    gap: 12px;

    &[data-type="success"] {
        .file-check-info {
            border-left-color: #52c41a;
            background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%);

            &:hover {
                background: linear-gradient(135deg, #f0f9e8 0%, #d1f2b8 100%);
            }
        }
    }

    &[data-type="fail"] {
        .file-check-info {
            border-left-color: #ff4d4f;
            background: linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%);

            &:hover {
                background: linear-gradient(135deg, #ffeae8 0%, #ffc1c1 100%);
            }

            // 非必要资源失败 - 橙色背景
            &.optional-fail {
                border-left-color: #fa8c16;
                background: linear-gradient(135deg, #fff7e6 0%, #ffd591 100%);

                &:hover {
                    background: linear-gradient(135deg, #fff1d6 0%, #ffcc7a 100%);
                }
            }
        }
    }

    .file-check-info {
        padding: 12px 16px;
        margin-bottom: 0;
        border: none;
        background: rgba(255, 255, 255, 0.9);
        border-radius: $border-radius;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        word-break: break-all;
        transition: $transition;
        position: relative;
        border-left: 4px solid transparent;
        display: flex;
        flex-direction: column;
        gap: 4px;
        @include hover-lift;

        .index-number {
            font-weight: 600;
            color: #666;
            font-size: 12px;
        }

        .file-path {
            font-weight: 500;
            font-family: 'Courier New', monospace;
            background: rgba(0, 0, 0, 0.05);
            padding: 2px 6px;
            border-radius: 4px;
            word-break: break-all;
        }

        .file-text {
            color: #666;
            font-size: 13px;
            line-height: 1.4;
        }
    }
}
</style>