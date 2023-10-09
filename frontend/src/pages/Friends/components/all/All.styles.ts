import { ListItemText } from '@mui/material'
import styled from 'styled-components'

export const StatusText = styled(ListItemText)`
  color: ${(props: any) => (props.primary === "online" ? "#00FF00" : "#ff0000")};
`;
