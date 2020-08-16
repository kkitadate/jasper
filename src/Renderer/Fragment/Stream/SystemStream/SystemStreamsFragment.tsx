import React from 'react';
import {SystemStreamId, SystemStreamRepo} from '../../../Repository/SystemStreamRepo';
import {SystemStreamEvent} from '../../../Event/SystemStreamEvent';
import {StreamEvent} from '../../../Event/StreamEvent';
import {LibraryStreamEvent} from '../../../Event/LibraryStreamEvent';
import {IssueEvent} from '../../../Event/IssueEvent';
import {IssueRepo} from '../../../Repository/IssueRepo';
import {SystemStreamEditorFragment} from './SystemStreamEditorFragment'
import {GARepo} from '../../../Repository/GARepo';
import {StreamPolling} from '../../../Infra/StreamPolling';
import {SystemStreamEntity} from '../../../Type/StreamEntity';
import {StreamRow} from '../../../Component/StreamRow';
import {SideSection} from '../../../Component/SideSection';
import {SideSectionTitle} from '../../../Component/SideSectionTitle';
import {SubscribeEditorFragment} from './SubscribeEditorFragment';
import {StreamIPC} from '../../../../IPC/StreamIPC';

type Props = {
}

type State = {
  streams: SystemStreamEntity[];
  selectedStream: SystemStreamEntity;
  showSubscribeEditor: boolean;
  showEditor: boolean;
  editingStream: SystemStreamEntity;
}

export class SystemStreamsFragment extends React.Component<Props, State> {
  state: State = {
    streams: [],
    selectedStream: null,
    showSubscribeEditor: false,
    showEditor: false,
    editingStream: null,
  };

  componentDidMount() {
    this.loadStreams();

    LibraryStreamEvent.onSelectStream(this, () => this.setState({selectedStream: null}));

    SystemStreamEvent.onUpdateStream(this, this.loadStreams.bind(this));
    SystemStreamEvent.onSelectStream(this, (stream)=>{
      if (stream.enabled) this.setState({selectedStream: stream});
    });
    SystemStreamEvent.onRestartAllStreams(this, this.loadStreams.bind(this));

    StreamEvent.onUpdateStream(this, this.loadStreams.bind(this));
    StreamEvent.onSelectStream(this, () => this.setState({selectedStream: null}));
    StreamEvent.onRestartAllStreams(this, this.loadStreams.bind(this));

    IssueEvent.onReadIssue(this, this.loadStreams.bind(this));
    IssueEvent.onReadIssues(this, this.loadStreams.bind(this));
    IssueEvent.onArchiveIssue(this, this.loadStreams.bind(this));
    IssueEvent.onReadAllIssues(this, this.loadStreams.bind(this));
    IssueEvent.onReadAllIssuesFromLibrary(this, this.loadStreams.bind(this));

    StreamIPC.onSelectSystemStreamMe(() => this.handleSelectStreamById(SystemStreamId.me));
    StreamIPC.onSelectSystemStreamTeam(() => this.handleSelectStreamById(SystemStreamId.team));
    StreamIPC.onSelectSystemStreamWatching(() => this.handleSelectStreamById(SystemStreamId.watching));
    StreamIPC.onSelectSystemStreamSubscription(() => this.handleSelectStreamById(SystemStreamId.subscription));
  }

  componentWillUnmount() {
    SystemStreamEvent.offAll(this);
    StreamEvent.offAll(this);
    LibraryStreamEvent.offAll(this);
    IssueEvent.offAll(this);
  }

  private async loadStreams() {
    const {error, systemStreams} = await SystemStreamRepo.getAllSystemStreams();
    if (error) return console.error(error);
    this.setState({streams: systemStreams});
  }

  private handleSelectStream(stream) {
    SystemStreamEvent.emitSelectStream(stream);
    this.setState({selectedStream: stream});
    GARepo.eventSystemStreamRead(stream.name);
  }

  private handleSelectStreamById(systemStreamId: number) {
    const stream = this.state.streams.find(s => s.id === systemStreamId);
    if (stream) this.handleSelectStream(stream);
  }

  private async handleReadAll(stream: SystemStreamEntity) {
    if (confirm(`Would you like to mark "${stream.name}" all as read?`)) {
      const {error} = await IssueRepo.updateReadAll(stream.id, stream.defaultFilter);
      if (error) return console.error(error);
      IssueEvent.emitReadAllIssues(stream.id);
      GARepo.eventSystemStreamReadAll(stream.name);
    }
  }

  private async handleEditorOpen(stream: SystemStreamEntity) {
    this.setState({showEditor: true, editingStream: stream});
  }

  private async handleEditorClose(edited: boolean, systemStreamId?: number) {
    this.setState({showEditor: false, editingStream: null});

    if (edited) {
      await StreamPolling.refreshSystemStream(systemStreamId);
      SystemStreamEvent.emitRestartAllStreams();
    }
  }

  private async handleSubscribeEditorOpen() {
    this.setState({showSubscribeEditor: true});
  }

  private async handleSubscribeEditorClose(newSubscribe: boolean) {
    this.setState({showSubscribeEditor: false});
    if (newSubscribe) {
      await StreamPolling.refreshSystemStream(SystemStreamId.subscription);
      SystemStreamEvent.emitRestartAllStreams();
      await this.loadStreams();

      const stream = this.state.streams.find((stream)=> stream.id === SystemStreamId.subscription);
      this.handleSelectStream(stream);
    }
  }

  render() {
    return (
      <SideSection>
        <SideSectionTitle>SYSTEM</SideSectionTitle>
        {this.renderStreams()}

      <SystemStreamEditorFragment
        show={this.state.showEditor}
        stream={this.state.editingStream}
        onClose={(edited, systemStreamId) => this.handleEditorClose(edited, systemStreamId)}
      />

      <SubscribeEditorFragment
        show={this.state.showSubscribeEditor}
        onClose={(newSubscribe) => this.handleSubscribeEditorClose(newSubscribe)}
      />
    </SideSection>
    );
  }

  private renderStreams() {
    return this.state.streams.map((stream, index) => {
      let onSubscribe;
      if (stream.id === SystemStreamId.subscription) {
        onSubscribe = () => this.handleSubscribeEditorOpen();
      }

      return (
        <StreamRow
          stream={stream}
          selected={this.state.selectedStream?.id === stream.id}
          onSelect={stream => this.handleSelectStream(stream)}
          onReadAll={stream => this.handleReadAll(stream as SystemStreamEntity)}
          onEdit={stream => this.handleEditorOpen(stream as SystemStreamEntity)}
          onSubscribe={onSubscribe}
          key={index}
        />
      );
    });
  }
}