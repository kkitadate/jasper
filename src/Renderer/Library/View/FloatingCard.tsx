import React from 'react';
import styled from 'styled-components';
import {ClickView} from './ClickView';
import {border, fontWeight, space} from '../Style/layout';
import {appTheme} from '../Style/appTheme';
import {View} from './View';
import {Text} from './Text';
import {Icon} from './Icon';
import {color} from '../Style/color';

type Props = {
  isShow: boolean;
  title: JSX.Element;
  onClick: () => void;
  onClose: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const FloatingCard: React.FC<Props> = (props) => {
  return (
    <Root style={props.style} className={props.className} isShow={props.isShow} onClick={props.onClick}>
      <TitleRow>
        <Icon name='information' color={color.stream.blue}/>
        <Title>{props.title}</Title>
        <View style={{flex: 1}}/>
        <ClickView onClick={props.onClose} className='close-button'>
          <Icon name='close'/>
        </ClickView>
      </TitleRow>
      <Body>
        {props.children}
      </Body>
    </Root>
  );
}

const Root = styled(ClickView)<{isShow: boolean}>`
  display: ${(props) => props.isShow ? 'flex' : 'none'};
  position: fixed;
  bottom: ${space.large}px;
  left: ${space.medium}px;
  width: 360px;
  border-radius: 6px;
  border: ${border.medium}px ${() => appTheme().border.normal};
  background-color: ${() => appTheme().bg.primary};
  padding: ${space.medium}px;
  box-shadow: 2px 2px 4px 1px #848484;
  
  & .close-button {
    display: none;
  }
  
  &:hover .close-button {
    display: flex;
  }
`;

const TitleRow = styled(View)`
  flex-direction: row;
  align-items: center;
  margin-bottom: ${space.medium}px;
`;

const Title = styled(Text)`
  margin-left: ${space.small}px;
  font-weight: ${fontWeight.bold};
`

const Body = styled(View)`
`;