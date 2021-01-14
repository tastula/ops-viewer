import React, { useEffect, useState } from 'react';
import courseData from './res/newCourses.json';
import Tree from 'react-d3-tree';
import parse from 'html-react-parser';
import { CourseUnit, LocalizedString, PrerequisiteGroup } from './models';
import { RawNodeDatum } from 'react-d3-tree/lib/types/common';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import Navbar from 'react-bootstrap/Navbar';

// Make sure only currently available courses appear
const filterCurriculums = true;
const cleanedCourseData: CourseUnit[] = (courseData as CourseUnit[]).filter((course: CourseUnit) => {
  return filterCurriculums ? course.curriculumPeriodIds.some((curriculum: string) => curriculum.includes('2020')) : true;
});

// Index courses by both internal groupId and known course code
const indexedCourses = new Map<string, CourseUnit>();
cleanedCourseData.forEach((course) => {
  indexedCourses.set(course.groupId, course);
  indexedCourses.set(course.code, course);
});

// List of available course codes
const courseCodes = cleanedCourseData.map((course) => course.code);

const preferEnglish: boolean = true;
const selectText = (
  text: LocalizedString | null | undefined,
  english: boolean = preferEnglish,
  placeholder: string = 'error',
): string => {
  if(text) {
    if(english) return text.en ?? text.fi ?? placeholder;
    return text.fi ?? text.en ?? placeholder;
  }
  return placeholder;
};

const createNodesForCourse = (preGroup: PrerequisiteGroup, compulsory: boolean = true): RawNodeDatum[] | undefined => {
  return preGroup.prerequisites.map((prerequisite) => {
    // Course, continue recursion
    if(prerequisite?.courseUnitGroupId) {
      const course = indexedCourses.get(prerequisite.courseUnitGroupId);
      if(course) {
        const preGroups = createNodesForPreGroup(course);
        return {
          name: selectText(course.name),
          children: preGroups?.length === 1 ? preGroups[0].children : preGroups,
          attributes: {
            node: 'course',
            code: course.code,
            type: compulsory ? 'compulsory' : 'recommended',
          }
        }
      }
    }
    // Study module or error
    return {
      name: prerequisite.moduleGroupId ?? 'no data',
    };
  })
};

const createNodesForPreGroup = (course: CourseUnit): RawNodeDatum[] | undefined => {
  const compulsory = course.compulsoryFormalPrerequisites?.map((preGroup, idx) => {
    return {
      name: `Group C${idx + 1}`,
      children: createNodesForCourse(preGroup),
      attributes: {
        node: 'group',
        type: 'compulsory',
      }
    };
  }) ?? [];
  const recommended = course.recommendedFormalPrerequisites?.map((preGroup, idx) => {
    return {
      name: `Group O${idx + 1}`,
      children: createNodesForCourse(preGroup, false),
      attributes: {
        node: 'group',
        type: 'recommended',
      }
    };
  }) ?? [];

  return compulsory.concat(recommended);
};

const createNodes = (courseCode: string): RawNodeDatum => {
  const course = indexedCourses.get(courseCode);
  if(course) {
    const preGroups = createNodesForPreGroup(course);
    return {
      name: selectText(course.name),
      children: preGroups?.length === 1 ? preGroups[0].children : preGroups,
    }
  }
  return emptyTree;
};

const emptyTree: RawNodeDatum = { name: 'no data'};

interface CourseInfoModalProps {
  node: RawNodeDatum | undefined;
  show: boolean;
  onHide: () => void;
}

function CourseInfoModal(props: CourseInfoModalProps) {
  const noAdditionalMessage = 'No additional prerequisite information.'
  // Default values are errors that get replaced
  let modalTitle = 'error';
  let modalBody = noAdditionalMessage;
  
  // Display course node
  if(props.node?.attributes?.node === 'course') {
    const course = indexedCourses.get(props.node?.attributes?.code);
    modalTitle = selectText(course?.name);
    modalBody = selectText(course?.prereqisites, preferEnglish, noAdditionalMessage);
  }

  // Display group node
  if(props.node?.attributes?.node === 'group') {
    const preType = props.node?.attributes?.type;
    modalTitle = props.node.name;
    modalBody = `This prerequisite group lists ${preType} courses and study modules.`;
  }

  return (
    <Modal
      show={props.show}
      size="lg"
      centered
      animation={false}
      onHide={props.onHide}
    >
      <Modal.Header closeButton>
        <Modal.Title>{modalTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
          {parse(modalBody)}
      </Modal.Body>
    </Modal>
  );
}

function App() {
  const [currentCourse, setCurrentCourse] = useState<string>('COMP.CS.350');
  const [clickedNode, setClickedNode] = useState<RawNodeDatum | undefined>(undefined);
  const [searchWord, setSearchWord] = useState<string>('');
  const [nodeData, setNodeData] = useState<RawNodeDatum>(emptyTree);
  const [infoVisible, setInfoVisible] = useState<boolean>(false);

  useEffect(() => {
    setNodeData(createNodes(currentCourse));
  }, [currentCourse]);

  const courseSearch = (): JSX.Element => (
    <InputGroup style={{ width: '300px' }}>
      <FormControl
        type="text"
        value={searchWord}
        placeholder="Search"
        onChange={(event) => setSearchWord(event.target.value)}
      />
    </InputGroup>
  );

  const courseList = (): JSX.Element => (
    <ListGroup>
      {courseCodes
        .filter((code) => code.toLowerCase().includes(searchWord.toLowerCase()))
        .map((code: string, idx: number) => (
          <ListGroup.Item variant="light" action active={code === currentCourse} key={idx} onClick={() => setCurrentCourse(code)}>
            {code}
          </ListGroup.Item>
        ))
      }
    </ListGroup>
  );

  const courseName = (): string => (
    `${currentCourse} ${selectText(indexedCourses.get(currentCourse)?.name)}`
  );

  const courseGraph = (): JSX.Element => (
    <Tree
      data={nodeData}
      pathFunc="step"
      orientation="vertical"
      collapsible={false}
      onNodeClick={(node) => openModal(node)}
      translate={{x: 800, y: 200}
    }/>
  );

  const openModal = (node: RawNodeDatum) => {
    console.log(node);
    const clickedName = node?.attributes?.code ?? node.name;
    if(clickedName !== 'no data') {
      setClickedNode(node);
      setInfoVisible(true);
    }
  };

  const nabBar = (): JSX.Element => (
    <Navbar variant="dark" style={{ height: '80px', background: '#4E008E' }}>
      {courseSearch()}
      <div style={{ marginLeft: '16px' }}>
        <Navbar.Brand>OPS viewer // {courseName()}</Navbar.Brand>
      </div>
    </Navbar>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {nabBar()}
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div style={{ width: '332px', height: 'calc(100vh - 80px)', overflowY: 'scroll', flexShrink: 0 }}>
          {courseList()}
        </div>
        <div style={{ flexGrow: 1 }}>
          {courseGraph()}
        </div>
      </div>
      <CourseInfoModal
        node={clickedNode}
        show={infoVisible}
        onHide={() => setInfoVisible(false)}
      />
    </div>
  );
}

export default App;
