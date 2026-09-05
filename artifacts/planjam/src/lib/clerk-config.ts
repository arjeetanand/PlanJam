import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';

export const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY 
  ? publishableKeyFromHost(
      window.location.hostname,
      import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
    )
  : null;

export const hasClerk = !!clerkPubKey;
export const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

export const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#F26F52',
    colorForeground: '#27304C',
    colorMutedForeground: '#6A6E80',
    colorDanger: '#A83F31',
    colorBackground: '#FFF7E8',
    colorInput: '#FFFDF5',
    colorInputForeground: '#27304C',
    colorNeutral: '#D9D7D0',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.8rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-[#FFF7E8] rounded-[24px] w-[440px] max-w-full overflow-hidden border-2 border-[#27304C] shadow-[8px_8px_0_#27304C]',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: '!text-[#27304C] !text-3xl !font-bold',
    headerSubtitle: '!text-[#6A6E80]',
    socialButtonsBlockButtonText: '!text-[#27304C] !font-bold',
    formFieldLabel: '!text-[#27304C] !font-bold',
    footerActionLink: '!text-[#F26F52] !font-bold',
    footerActionText: '!text-[#6A6E80]',
    dividerText: '!text-[#8A8D9B]',
    identityPreviewEditButton: '!text-[#F26F52]',
    formFieldSuccessText: '!text-[#277865]',
    alertText: '!text-[#A83F31]',
    logoBox: 'rounded-xl overflow-hidden',
    logoImage: 'object-contain',
    socialButtonsBlockButton: '!border-[#D9D7D0] !bg-[#FFFDF5] !rounded-xl',
    formButtonPrimary: '!bg-[#F26F52] !text-[#FFF7E8] !font-bold !rounded-full !shadow-none',
    formFieldInput: '!bg-[#FFFDF5] !border-[#D9D7D0] !text-[#27304C] !rounded-xl',
    footerAction: '!bg-transparent',
    dividerLine: '!bg-[#D9D7D0]',
    alert: '!bg-[#FFD9D3] !border-[#F26F52]',
    otpCodeFieldInput: '!bg-[#FFFDF5] !border-[#D9D7D0] !text-[#27304C]',
    formFieldRow: 'gap-2',
    main: 'gap-5',
  },
} as const;
