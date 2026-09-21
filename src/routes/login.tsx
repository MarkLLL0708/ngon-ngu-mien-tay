import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/tangpt/LoginPage";
export const Route = createFileRoute("/login")({ head:()=>({meta:[{title:"Đăng nhập — TánGPT"},{name:"description",content:"Đăng nhập hoặc tạo tài khoản TánGPT."},{property:"og:title",content:"Đăng nhập — TánGPT"},{property:"og:description",content:"Bắt đầu nhắn tin duyên dáng, đúng chất vùng miền."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary_large_image"}]}), component: LoginPage });
