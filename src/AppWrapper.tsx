import * as React from 'react'

import { SaasProvider } from '@saas-ui/react'
import { theme } from './theme'

export function AppWrapper({children}: React.PropsWithChildren) {
  return (
    // resetCSS={false} will make some Mosaic params look better
    <SaasProvider theme={theme}>
        {children}
    </SaasProvider>
  )
}